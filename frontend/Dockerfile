# syntax=docker/dockerfile:1
#
# Build com Bun + Vite (ADR-011) e entrega dos arquivos estáticos pelo nginx.
# O frontend não tem runtime em produção: o resultado do build é só HTML, JS e CSS.
# Contexto de build: a pasta frontend/.

FROM oven/bun:1.4.2 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Variável do Vite: é embutida no JS no momento do build, não lida em tempo de execução.
# Trocar a URL da API exige rebuild da imagem (regra 1 de empacotamento, CLAUDE.md §3).
ARG VITE_API_BASE_URL=http://localhost:8081
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN bun run build

FROM nginx:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
