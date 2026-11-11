# ADR-020 — Papel de Admin da plataforma

- **Status:** Proposto
- **Data:** 2026-10-27
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Identity (papel no usuário e no token), Tenancy (fila de análise e decisões)
- **Substitui:** —
- **Substituído por:** —
- **Complementa:** ADR-004 (identidade, papéis e conta global)

---

## Contexto

**Fato.** A ADR-004 nomeia quatro papéis: `Owner`, `Professional`, `Customer` e `Admin` (plataforma). Até
27/10 o código não tinha nenhuma forma de ser Admin: nem coluna, nem claim, nem policy.

**Fato.** O `Business` já tinha `Approve()`, `ReturnToDraft()`, `Suspend()`, `Reactivate()`, `Verify()` e
`RejectVerification()`, mas nenhum endpoint os chamava. O `seed-demo.ts` aprovava estabelecimentos com um
`UPDATE tenancy.business` direto no banco.

**Fato.** Os papéis de estabelecimento (`Owner`, `Professional`) vivem em `BusinessMembership` e entram no
token como `businessId` + `ctx`, trocados por `POST /api/users/me/context`. O Admin não pertence a nenhum
estabelecimento: ele decide sobre todos.

## Problema

Onde mora o papel de Admin da plataforma, como ele chega ao token e quem pode concedê-lo?

## Alternativas consideradas

### A — Lista de e-mails em configuração (`Admin:Emails`)

**A favor:** nenhuma migration; trocar o Admin é trocar a configuração.
**Contra:** o papel some do banco. Não há registro de quem é Admin nem desde quando, e uma configuração
errada no deploy concede o papel em silêncio. Não é auditável.

### B — Mais um valor em `BusinessMembership.Role`

**A favor:** reaproveita o mecanismo de papel que já existe.
**Contra:** membership é por estabelecimento; o Admin precisaria de uma membership falsa, ou de um
`businessId` nulo numa tabela em que ele nunca é nulo. Mistura o tenant com a plataforma.

### C — Coluna no `User`, claim própria no token, policy por atributo

**A favor:** o papel fica no banco, ao lado da conta, e entra no token a cada emissão; revogar no banco vale a
partir do próximo token. Independe do contexto de estabelecimento.
**Contra:** uma migration; o papel é um booleano, sem histórico de concessão.

## Decisão

Adotamos **C**.

- `identity."user".is_platform_admin`, `NOT NULL DEFAULT false` (migration `AddPlatformAdmin`, aditiva).
- **Nunca concedido por endpoint.** Só por seed ou SQL no banco: conceder o papel exige acesso ao banco.
  `User.GrantPlatformAdmin()` existe para o seed e os testes; nenhum comando da aplicação o chama.
- O token carrega a claim `platform=admin` quando a conta tem o papel. `businessId`/`ctx` e o papel de
  plataforma são independentes.
- Policy `PlatformAdmin` em `[Authorize(Policy = …)]` nos controllers de Admin, e uma segunda trava no comando
  (`RequirePlatformAdmin`), para que um endpoint novo sem a policy não abra a operação por engano.
- Endpoints em `api/admin/businesses`: lista por estado, detalhe com checklist, aprovar, recusar (nota
  obrigatória), suspender, reinstalar. Aprovar e recusar registram `VerifiedByUserId`, nota e data.

## Consequências

### O que fica mais fácil

- O seed aprova pela API, pelas mesmas regras que um Admin real.
- O ciclo de vida do estabelecimento passa a ser testável de ponta a ponta.

### O que fica mais difícil

- O papel não tem histórico: quem concedeu e quando não fica registrado. Revogar exige SQL.
- O token emitido antes de revogar o papel continua valendo até expirar (até 60 min, `Jwt:AccessTokenMinutes`).
- Suspender e reinstalar não guardam motivo nem autor: o `Business` não tem campo para isso.

### O que passa a ser proibido

- Endpoint que conceda ou revogue o papel de Admin.
- Controller de Admin sem a policy `PlatformAdmin`.
- Tratar `businessId` no token como pista de papel de plataforma, ou o contrário.

## Premissa não verificada

**Um booleano basta para o TCC.** Inferência pelo recorte: um Admin, operado pelos autores. Se a plataforma
tiver mais de um nível de administração (suporte, moderação), o booleano vira papel enumerado e esta ADR é
revista.

## Como saber que erramos

- Se for preciso saber quem concedeu o papel a alguém e não houver como responder.
- Se aparecer um segundo tipo de operador de plataforma.

## Referências

- ADR-004 · `backend/src/Core/Booking.Domain/Entity/Module/Identity/User.cs`
- `backend/src/Presentation/Booking.Api/Module/Tenancy/AdminBusinessesController.cs`
- `backend/src/Core/Booking.Application/Module/Tenancy/Commands/AdminBusinessCommands.cs`
- `backend/tests/Booking.IntegrationTests/Tenancy/AdminBusinessTests.cs` — E1 a E6
