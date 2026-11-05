#!/usr/bin/env bash
# Demonstração pública pelo Cloudflare Tunnel (docs/operacao/demo-publica.md).
#
#   ./scripts/demo-publica.sh           sobe a pilha + o túnel e mostra o endereço público
#   ./scripts/demo-publica.sh --parar   derruba só o túnel e volta a API para o uso local
#   ./scripts/demo-publica.sh --diagnostico                        outbox por estado e últimas falhas de e-mail
#   ./scripts/demo-publica.sh --diagnostico --reprocessar-falhos   devolve à fila as entregas que falharam
#
# Só o `web` (site + /api + /media pelo nginx) vai para o túnel. A API, o banco e o Mailpit continuam em 127.0.0.1;
# o Mailpit NUNCA fica público. O endereço muda a cada subida do túnel, e quem tiver o link entra.
#
# Outra pilha ou outro arquivo de variáveis: PROJETO=nome ENV_FILE=caminho ./scripts/demo-publica.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
env_file="${ENV_FILE:-$root/.env}"
timeout="${TIMEOUT_SEGUNDOS:-60}"
[ -f "$env_file" ] || { echo "Falta o $env_file. Rode ./scripts/setup-env.sh antes." >&2; exit 1; }

compose=(docker compose -f "$root/compose.yaml" --env-file "$env_file")
[ -n "${PROJETO:-}" ] && compose+=(-p "$PROJETO")

# Lê um valor do arquivo de variáveis sem mostrá-lo.
env_value() { grep -E "^\s*$1\s*=" "$env_file" | tail -n 1 | cut -d= -f2- | tr -d '[:space:]' || true; }

web_port="$(env_value WEB_PORT)"; web_port="${web_port:-8080}"

run_sql() { "${compose[@]}" exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -P pager=off'; }

if [ "${1:-}" = "--diagnostico" ]; then
  # Só contagens e o texto do erro, com qualquer e-mail trocado por <e-mail>: nem dado pessoal nem segredo.
  echo "Outbox por estado:"
  run_sql <<'SQL'
SELECT CASE WHEN processed_at IS NOT NULL THEN 'processado' WHEN failed_at IS NOT NULL THEN 'falho' ELSE 'pendente' END AS estado,
       count(*) AS total
FROM notifications.outbox GROUP BY 1 ORDER BY 1;
SQL
  echo "Últimas falhas (erro sem e-mails):"
  run_sql <<'SQL'
SELECT created_at, attempts,
       regexp_replace(left(coalesce(last_error, ''), 240), '[[:alnum:]._%+-]+@[[:alnum:].-]+', '<e-mail>', 'g') AS erro
FROM notifications.outbox WHERE last_error IS NOT NULL AND processed_at IS NULL
ORDER BY created_at DESC LIMIT 5;
SQL
  if [ "${2:-}" = "--reprocessar-falhos" ]; then
    echo "Reprocessando as entregas que falharam..."
    echo "UPDATE notifications.outbox SET attempts = 0, next_attempt_at = now(), failed_at = NULL WHERE processed_at IS NULL;" | run_sql
    echo "Feito: o worker tenta de novo em até 5 s. Rode --diagnostico outra vez para ver o resultado."
  fi
  exit 0
fi

if [ "${1:-}" = "--parar" ]; then
  echo "Derrubando o túnel..."
  "${compose[@]}" --profile tunnel rm --stop --force cloudflared >/dev/null
  # A API volta para o uso local: Development e links apontando para localhost.
  env -u ASPNETCORE_ENVIRONMENT -u APP_PUBLIC_BASE_URL "${compose[@]}" up -d --no-deps --force-recreate api >/dev/null
  echo "Túnel derrubado. O endereço antigo deixou de funcionar; a pilha local segue em http://localhost:$web_port."
  exit 0
fi

# Diz QUAIS variáveis faltam, nunca os valores. O SMTP é opcional (sem ele, os e-mails vão para o Mailpit local), mas
# se começou a preencher, tem de preencher inteiro.
faltam=()
for v in JWT_SIGNING_KEY POSTGRES_PASSWORD SEED_PASSWORD SEED_ADMIN_PASSWORD; do
  [ -n "$(env_value "$v")" ] || faltam+=("$v")
done
if [ -z "$(env_value Email__Smtp__Host)" ]; then
  echo "AVISO: sem SMTP no .env, os e-mails vão para o Mailpit local, que não é público. Quem abrir o link não" >&2
  echo "recebe a confirmação de cadastro; só as contas do seed entram. Para e-mail de verdade, preencha o bloco do" >&2
  echo "Gmail no .env (ver .env.example)." >&2
else
  for v in Email__Smtp__Host Email__Smtp__Port Email__Smtp__Username Email__Smtp__Password Email__From; do
    [ -n "$(env_value "$v")" ] || faltam+=("$v")
  done
fi
if [ "${#faltam[@]}" -gt 0 ]; then
  echo "Faltam no $env_file: ${faltam[*]}. Preencha (modelo no .env.example) e rode de novo." >&2
  exit 1
fi

# O compose lê o ambiente do processo antes do arquivo: é assim que a API sobe em Production com o endereço do túnel.
export ASPNETCORE_ENVIRONMENT=Production

# O contêiner do túnel é recriado a cada execução: um antigo guarda a rede e o endereço da vez anterior, e o Docker
# recusa iniciar ("network not found") ou o log traz um endereço que já morreu.
echo "Subindo a pilha e o túnel (pode levar alguns minutos no primeiro build)..."
"${compose[@]}" --profile tunnel rm --stop --force cloudflared >/dev/null 2>&1 || true
"${compose[@]}" --profile tunnel up -d --build --force-recreate cloudflared
"${compose[@]}" --profile tunnel up -d --build

echo "Esperando o endereço do túnel..."
url=""
deadline=$((SECONDS + timeout))
while [ -z "$url" ] && [ "$SECONDS" -lt "$deadline" ]; do
  sleep 2
  # O ÚLTIMO endereço dos logs: o primeiro pode ser de uma execução anterior.
  url="$("${compose[@]}" --profile tunnel logs cloudflared 2>&1 | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -n 1 || true)"
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
# Só mostra o endereço depois que /api/health responde 200 por ele: um endereço que ainda dá erro 1033 não ajuda ninguém.
[ -n "$ok" ] || { echo "O endereço $url não respondeu 200 em /api/health em ${timeout}s. Veja: docker compose logs cloudflared api; rode de novo." >&2; exit 1; }

echo
echo "  Endereço público:  $url"
echo
command -v qrencode >/dev/null && qrencode -t ANSIUTF8 "$url"
echo "  ATENÇÃO: o endereço do túnel rápido muda a cada início. Links de e-mails enviados antes deixam de funcionar;"
echo "  peça o e-mail de novo. Quem tiver o link entra."
echo "  Contas de demonstração: bun scripts/seed-demo.ts com SEED_PASSWORD definida (ver o guia)."
echo "  Para derrubar:      ./scripts/demo-publica.sh --parar"
