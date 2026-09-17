# ADR-011 — Bun como gerenciador de pacotes e executor de scripts do frontend; Vite permanece o bundler

- **Status:** Aceito
- **Data:** 2026-09-17
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** frontend
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

O frontend ainda não existia como aplicação: `frontend/` tinha apenas `tokens.css`, o README dos
tokens e pastas vazias. Não havia `package.json`, `package-lock.json` nem `node_modules`.

**Fatos:**

- O frontend é uma SPA em React + TypeScript com Vite (ADR-001). **Não há runtime em produção:**
  o Vite gera arquivos estáticos, servidos por um servidor web qualquer.
- Os quatro repositórios recentes do desenvolvedor do frontend usam npm com Vite.
- O CI já tinha um check obrigatório com nome fixo, `frontend / build-lint`.
- O repositório está praticamente vazio: o custo de trocar de gerenciador de pacotes nunca será
  menor do que agora.

## Problema

Qual gerenciador de pacotes o frontend usa — e até onde o Bun entra, já que ele também é runtime,
bundler e executor de testes?

## Alternativas consideradas

### A — Continuar com npm

**A favor:** é o que a equipe já usa; zero migração; ecossistema sem nenhuma aresta; suporte a
Windows idêntico ao de Linux.

**Contra:** instalação e execução de scripts mais lentas. E o custo de migrar **sobe a cada semana**:
hoje o frontend está vazio; depois de vinte componentes, um lockfile grande e ferramentas
configuradas, a mesma troca vira um dia perdido. **Rejeitada.**

### B — Bun como gerenciador de pacotes e executor de scripts, mantendo o Vite

**A favor:** instalação e execução de scripts bem mais rápidas; um binário só; lockfile em texto,
que aparece no diff do PR. O risco fica contido: se o Bun atrapalhar, voltar para npm é recriar um
lockfile, porque nada no código depende do Bun.

**Contra:** ferramenta menos rodada que o npm, especialmente no Windows; mais uma versão para manter
igual entre as duas máquinas e o CI.

### C — Bun também como bundler, dev server e runtime

**A favor:** uma ferramenta só para tudo.

**Contra:** trocaria o Vite — maduro, documentado e com plugins — por um bundler bem menos rodado,
**sem ganho para uma SPA que gera estáticos**. E traria os problemas conhecidos do Bun como runtime
de servidor: depuração instável, incompatibilidade pontual de ecossistema, ausência de sandbox.
Esses problemas são de **runtime de servidor** e não se aplicam a um frontend estático — mas adotar
o bundler do Bun aproximaria o projeto deles sem necessidade. **Rejeitada.**

## Decisão

Adotamos **B**.

- **Bun** é gerenciador de pacotes, executor de scripts e quem sobe o dev server.
- **Vite continua sendo o bundler.** O bundler e o dev server nativos do Bun estão **rejeitados**.
  Trocar o Vite exige ADR novo.
- **Versão fixada em `frontend/.bun-version`** — hoje `1.4.2`. É o mesmo arquivo lido pelo CI, via
  `oven-sh/setup-bun@v2` com `bun-version-file`. Uma fonte só para as duas máquinas e o CI.
- **Lockfile `bun.lock`, em texto,** versionado. Lockfile binário não aparece em diff de pull
  request, e a revisão por CODEOWNERS depende do diff. Se algum dia sair `bun.lockb`, é erro.
- No CI, `bun install --frozen-lockfile` — equivalente ao `npm ci`: falha se o lockfile estiver
  desatualizado, em vez de atualizá-lo em silêncio.

**O que não muda:** o nome do check obrigatório continua `frontend / build-lint`, e o workflow
continua sem filtro de caminho no gatilho, decidindo internamente se roda o build (ADR-010, mesma
lógica do backend).

## Consequências

### O que fica mais fácil

- Instalação e execução de scripts mais rápidas, no CI e nas duas máquinas.
- Um binário resolve instalação, execução de script e dev server.
- O lockfile é revisável no PR.

### O que fica mais difícil

- Mais uma ferramenta para instalar e manter na mesma versão em três lugares.
- Bug de compatibilidade do Bun com algum pacote vira problema novo, que o npm não teria.
- O ecossistema documenta `npm run`; toda receita encontrada na internet precisa de tradução.

### O que passa a ser proibido

- `npm install`, `package-lock.json` e `node_modules` gerados por npm no `frontend/`.
- Lockfile binário (`bun.lockb`).
- Usar o bundler, o dev server ou o runtime do Bun no lugar do Vite, sem ADR novo.
- Renomear o check `frontend / build-lint`.

## Premissa não verificada

**Premissa:** o Bun funciona bem o bastante no Windows para as duas máquinas da equipe.

**Natureza:** **parcialmente verificada.** Foi validado na máquina do Arthur, Windows 11, com Bun
1.4.2: `bun install` do zero, `lint`, `typecheck`, `format:check`, `test` (Vitest), `build` e dev
server, todos sem erro. **A máquina do Rafael ainda não foi testada** — e é ele quem vai usar o
frontend todos os dias.

É conhecido que o suporte do Bun no Windows é mais recente que em Linux e macOS.

**O que muda se for contradita:** se o Rafael encontrar problema, **registre em issue, não contorne
em silêncio.** Contorno não registrado em ferramenta de build é o tipo de dívida que só aparece na
semana 8. Se o problema não tiver solução razoável, esta ADR é substituída e o frontend volta para
o npm — o que custa recriar um lockfile, porque nenhum código depende do Bun.

## Como saber que erramos

- Se aparecer pacote que não instala ou não roda sob o Bun e a correção exigir gambiarra.
- Se o `bun.lock` gerar diferença entre as duas máquinas para o mesmo `package.json`.
- Se o tempo gasto contornando o Bun passar do tempo que ele economiza.
- Se o dev server do Vite sob o Bun tiver hot reload menos confiável que sob o Node.

## Referências

- ADR-001 — stack do frontend · ADR-010 — o mesmo desenho de CI, aplicado ao backend
- `frontend/.bun-version`, `frontend/package.json`, `.github/workflows/frontend-ci.yml`
- [oven-sh/setup-bun](https://github.com/oven-sh/setup-bun) — consultado em 2026-09-17
- Verificação local em 2026-09-17: Bun 1.4.2, Windows 11, Vite 8.3.0, React 19.3.0, Vitest 5.0.1
