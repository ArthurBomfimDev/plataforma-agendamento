# ADR-002 — Revogação da stack declarada no pitch

- **Status:** Proposto
- **Data:** 2026-10-26
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** todos
- **Substitui:** —
- **Substituído por:** —
- **Complementa:** ADR-001

---

## Contexto

**Fato.** O pitch apresentado à FATEC no início do projeto (`docs/contexto/05_Agendeaki_Pitch_TCC.md`,
seção "Stack tecnológico") declarou:

- Frontend: React Native (iOS e Android) e React.js para o painel web; geolocalização nativa.
- Backend: Node.js com NestJS, arquitetura orientada a eventos, PostgreSQL + Redis, API REST + WebSockets.
- Infraestrutura: AWS / Google Cloud, Docker com auto-scaling, Pagar.me / Mercado Pago, WhatsApp API + Twilio.
- Produto: Pix, cartão, sinal antecipado e split automático.

**Fato.** A ADR-001 (09/09) escolheu React + TypeScript + Vite, .NET 10 e PostgreSQL, avaliando como
alternativas o NestJS e o React Native do pitch. O `PROJECT-CONTEXT.md` (§10) registra como resolvidas as
contradições com o pitch — stack, Redis, Pix/split/carteira — e anota que esta ADR ainda não estava escrita.

**Fato.** O documento do pitch está marcado em `CLAUDE.md` §8 e no `PROJECT-CONTEXT.md` §3 como
**não usar como fonte**.

**Inferência.** A banca vai comparar o que foi prometido com o que foi entregue. Sem um registro explícito
da troca, a diferença lê como incoerência; com ele, lê como decisão.

## Problema

Como tratar os compromissos técnicos do pitch que o projeto deixou de seguir, de modo que a mudança seja
rastreável e defensável?

## Alternativas consideradas

### A — Manter o pitch como referência e ajustar o projeto a ele

**A favor:** coerência literal com o que foi apresentado; nenhuma explicação a dar.
**Contra:** a ADR-001 já mostrou o custo — semanas de aprendizado de NestJS e de React Native em vez de
modelar disponibilidade e concorrência, que são o núcleo do trabalho. Redis e arquitetura orientada a
eventos resolvem problemas de escala que uma demonstração controlada não tem (ADR-005, ADR-010 regra 7).

### B — Deixar a mudança implícita na ADR-001

**A favor:** nenhum documento novo; a ADR-001 já descreve as alternativas do pitch.
**Contra:** a ADR-001 decide a stack, não revoga o pitch. Itens do pitch que não são stack — Redis,
WebSockets, auto-scaling, pagamento, WhatsApp — ficam sem registro de que foram abandonados, e o pitch
continua parecendo vigente para quem lê o repositório.

### C — Revogar formalmente o pitch, item por item

**A favor:** cada compromisso do pitch tem destino declarado e motivo; a ADR-001 fica responsável só pela
escolha da stack.
**Contra:** mais um documento para manter; expõe, por escrito, a distância entre a proposta e a entrega.

## Decisão

Adotamos **C**. Os compromissos técnicos do pitch estão revogados, com o seguinte destino:

| Compromisso do pitch | Destino | Onde está decidido |
|---|---|---|
| React Native (iOS e Android) | Substituído por **PWA**, com Capacitor e Tauri consumindo o mesmo build | ADR-001; `CLAUDE.md` §3 |
| React.js para o painel | Mantido, com **Vite** e paridade mobile do painel | ADR-001, ADR-009, ADR-011 |
| Node.js com NestJS | Substituído por **.NET 10 / ASP.NET Core** | ADR-001 |
| Arquitetura orientada a eventos | Substituída por **monólito modular**; evento só via Outbox na mesma transação | ADR-007, ADR-010 regra 7 |
| PostgreSQL + Redis | **PostgreSQL** mantido (com PostGIS e `btree_gist`); **Redis rejeitado** — a garantia contra dupla reserva fica no banco | ADR-005 |
| API REST + WebSockets | **REST** mantido; WebSockets fora do MVP | ⚠️ não verificado: não há ADR sobre WebSockets; o fora de escopo está no `PROJECT-CONTEXT.md` §9 só por consequência (chat e tempo real fora) |
| AWS / Google Cloud, Docker com auto-scaling | Substituídos por hospedagem de custo próximo de zero; decisão em aberto | ADR-008 (Proposto) |
| Pagar.me / Mercado Pago; Pix, cartão, sinal, split | **Fora do MVP**; só a porta `IPaymentGateway`, sem adaptador | `CLAUDE.md` §1; `PROJECT-CONTEXT.md` §9 |
| WhatsApp API + Twilio | **Fora do MVP**; notificação por e-mail + in-app, também fora do recorte de entrega | `docs/produto/decisoes-localizacao-notificacao-modelo.md` §6 |

O pitch continua no repositório como registro histórico, em `docs/contexto/`, e não é fonte de decisão.

## Consequências

### O que fica mais fácil

- Explicar à banca, com um documento só, por que a entrega difere do que foi apresentado.
- Impedir que um item do pitch volte por engano, citado como "já estava previsto".

### O que fica mais difícil

- O texto do TCC precisa dizer, no capítulo de método ou de desenvolvimento, que a proposta inicial foi
  revista — a diferença fica visível em vez de diluída.
- Quem leu só o pitch encontra um projeto diferente.

### O que passa a ser proibido

- Citar o pitch como fonte de requisito ou de decisão técnica.
- Reintroduzir React Native, NestJS, Redis, barramento de eventos ou WebSockets sem ADR nova.

## Como saber que erramos

- Se a orientadora ou a banca entender a revisão como abandono de escopo, e não como decisão: o registro
  existe, mas a justificativa não convenceu, e o capítulo do TCC precisa reforçá-la.
- Se algum item revogado se mostrar necessário antes da entrega (por exemplo, tempo real para a agenda do
  painel), a revogação foi ampla demais para aquele item.

## Referências

- `docs/contexto/05_Agendeaki_Pitch_TCC.md` — objeto da revogação
- ADR-001 — stack · ADR-005 — dupla reserva sem Redis · ADR-007 e ADR-010 — monólito modular, Outbox
- ADR-008 — hospedagem (Proposto) · ADR-009 — paridade mobile · ADR-011 — Bun e Vite
- `PROJECT-CONTEXT.md` §9 (fora do MVP), §10 (contradições resolvidas)
