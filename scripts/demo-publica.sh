#!/usr/bin/env bash
# Demonstração pública pelo Cloudflare Tunnel (docs/operacao/demo-publica.md).
#
#   ./scripts/demo-publica.sh           sobe a pilha + o túnel e mostra o endereço público
#   ./scripts/demo-publica.sh --parar   derruba só o túnel e volta a API para o uso local
#
# Só o `web` (site + /api + /media pelo nginx) vai para o túnel. A API, o banco e o Mailpit continuam em 127.0.0.1;
# o Mailpit NUNCA fica público. O endereço muda a cada subida do túnel, e quem tiver o link entra.
#
# Outra pilha ou outro arquivo de variáveis: PROJETO=nome ENV_FILE=caminho ./scripts/demo-publica.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
env_file="${ENV_FILE:-$root/.env}"
timeout="${TIMEOUT_SEGUNDOS:-90}"
[ -f "$env_file" ] || { echo "Falta o $env_file. Rode ./scripts/setup-env.sh antes." >&2; exit 1; }

compose=(docker compose -f "$root/compose.yaml" --env-file "$env_file")
[ -n "${PROJETO:-}" ] && compose+=(-p "$PROJETO")

# Lê um valor do arquivo de variáveis sem mostrá-lo.
env_value() { grep -E "^\s*$1\s*=" "$env_file" | tail -n 1 | cut -d= -f2- | tr -d '[:space:]' || true; }

web_port="$(env_value WEB_PORT)"; web_port="${web_port:-8080}"

if [ "${1:-}" = "--parar" ]; then
  echo "Derrubando o túnel..."
  "${compose[@]}" --profile tunnel rm --stop --force cloudflared >/dev/null
  # A API volta para o uso local: Development e links apontando para localhost.
  env -u ASPNETCORE_ENVIRONMENT -u APP_PUBLIC_BASE_URL "${compose[@]}" up -d --no-deps --force-recreate api >/dev/null
  echo "Túnel derrubado. O endereço antigo deixou de funcionar; a pilha local segue em http://localhost:$web_port."
  exit 0
fi

if [ -z "$(env_value Email__Smtp__Host)" ]; then
  echo "AVISO: sem SMTP no .env, os e-mails vão para o Mailpit local, que não é público. Quem abrir o link não" >&2
  echo "recebe a confirmação de cadastro; só as contas do seed entram. Para e-mail de verdade, preencha o bloco do" >&2
  echo "Gmail no .env (ver .env.example)." >&2
fi

# O compose lê o ambiente do processo antes do arquivo: é assim que a API sobe em Production com o endereço do túnel.
export ASPNETCORE_ENVIRONMENT=Production
echo "Subindo a pilha e o túnel (pode levar alguns minutos no primeiro build)..."
"${compose[@]}" --profile tunnel up -d --build

echo "Esperando o endereço do túnel..."
url=""
deadline=$((SECONDS + timeout))
while [ -z "$url" ] && [ "$SECONDS" -lt "$deadline" ]; do
  sleep 2
  url="$("${compose[@]}" --profile tunnel logs cloudflared 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -n 1 || true)"
done
[ -n "$url" ] || { echo "O cloudflared não mostrou o endereço em ${timeout}s. Veja: docker compose logs cloudflared" >&2; exit 1; }

# Os links dos e-mails (confirmação, nova senha) precisam do endereço público: recria só a API.
export APP_PUBLIC_BASE_URL="$url"
"${compose[@]}" up -d --no-deps --force-recreate api >/dev/null

echo "Esperando a API responder pelo endereço público..."
ok=""
deadline=$((SECONDS + timeout))
while [ -z "$ok" ] && [ "$SECONDS" -lt "$deadline" ]; do
  sleep 3
  curl -fsS --max-time 10 "$url/api/health" >/dev/null 2>&1 && ok=1 || true
done
[ -n "$ok" ] || echo "AVISO: o endereço ainda não respondeu (a Cloudflare pode levar mais um pouco). Tente abrir: $url" >&2

echo
echo "  Endereço público:  $url"
echo
command -v qrencode >/dev/null && qrencode -t ANSIUTF8 "$url"
echo "  Quem tiver o link entra. O endereço muda a cada subida do túnel."
echo "  Contas de demonstração: bun scripts/seed-demo.ts com SEED_PASSWORD definida (ver o guia)."
echo "  Para derrubar:      ./scripts/demo-publica.sh --parar"
