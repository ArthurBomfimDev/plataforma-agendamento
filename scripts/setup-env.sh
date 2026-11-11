#!/usr/bin/env sh
# Gera o .env na raiz do repositório com senha e chave JWT aleatórias.
# Não sobrescreve um .env existente. Uso: ./scripts/setup-env.sh
set -eu

root="$(cd "$(dirname "$0")/.." && pwd)"
target="$root/.env"

if [ -f "$target" ]; then
  echo ".env já existe — nada foi alterado. Apague-o para gerar um novo."
  exit 0
fi

secret() { openssl rand -base64 "$1" | tr -d '+/=\n'; }

sed -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(secret 24)|" \
    -e "s|^JWT_SIGNING_KEY=.*|JWT_SIGNING_KEY=$(secret 48)|" \
    "$root/.env.example" > "$target"

echo ".env criado com senha e chave aleatórias."
