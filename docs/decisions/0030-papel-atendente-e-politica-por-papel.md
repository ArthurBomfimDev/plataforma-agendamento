# ADR-030 — Papel Atendente e a política de autorização por papel

- **Status:** Proposto
- **Data:** 2026-11-04
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Tenancy (`BusinessMembershipRole`), Scheduling (`AppointmentAccess`), Availability (bloqueios), todos os casos de uso do lado do estabelecimento
- **Substitui:** —
- **Substituído por:** —
- **Complementa:** ADR-004 (identidade e papéis), ADR-029 (convite de equipe)

---

## Contexto

**Fato.** Existiam `Owner` e `Professional`. A agenda toda era do dono; o profissional via só a própria. Quem opera o
balcão sem ser dono (recepção) não tinha papel: ou virava dono, ou ficava sem acesso.

**Decisão do produto (Arthur).** `Attendant` (atendente) vê e opera agenda e pedidos de **todos** os profissionais
(confirmar, recusar, concluir, falta, encaixe, bloqueios), mas **não** edita serviços, equipe, configurações, fotos nem
convites. Ocupa vaga no `SeatLimit`.

## Problema

Como acrescentar um papel sem espalhar `if (papel == ...)` pelo código, e sem deixar uma rota nova nascer aberta por
esquecimento?

## Decisão

- Duas perguntas, em um lugar só (`ActorContextExtensions`): `RequireOwner()` (só o dono) e `OperatesWholeAgenda()` /
  `RequireAgendaOperator()` (dono ou atendente).
- `AppointmentAccess.RestrictToProfessionalAsync` devolve "sem restrição" para dono e atendente; o profissional continua
  restrito à própria agenda (a de outro responde como inexistente).
- Bloqueios e férias (`AddScheduleException`, `RemoveScheduleException`, a prévia e o cancelamento em massa) passam a ser
  de dono e atendente, de todos os profissionais. O **profissional** mexe só nos próprios (`AgendaScope`): o de outro, ou o
  do estabelecimento todo, dá 403. **Jornada** continua só do dono.
- O profissional com conta edita a própria especialidade e bio (`PUT professionals/me`); nome e situação são do dono.
- **A lista é fechada por teste.** `RolePolicyTests` classifica cada caso de uso (só o dono, dono e atendente, Admin,
  restrito por agenda, independente do papel) e reprova se aparecer um sem classe. Os casos de dono-só e de Admin são
  chamados com repositórios **nulos**: se algum tocar em dado antes de conferir o papel, o teste quebra.
- A prova por HTTP (`AttendantTests`, 403 em 28 rotas) está escrita e não foi rodada (sem Docker).

## Consequências

**Positivas.** Um papel novo custa uma linha; esquecer de classificar um caso de uso reprova o build.

**Negativas.** A leitura `GET /api/businesses/current` é só do dono; o atendente recebe 403 e o painel dele não pode
depender dela (o frontend do atendente usa `GET /api/users/me` para o nome do estabelecimento).

**Pendências.** O teste cobre a camada de aplicação. Um controller novo sem `[Authorize]` não é pego por ele; fica para
um teste estrutural dos controllers.

## Referências

`docs/produto/contrato-api-frontend.md` §4.12 · `docs/verificacao-pendente.md`
