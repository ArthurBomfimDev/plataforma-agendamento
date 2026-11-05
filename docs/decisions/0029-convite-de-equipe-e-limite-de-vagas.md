# ADR-029 — Convite de equipe por e-mail e limite de vagas

- **Status:** Proposto
- **Data:** 2026-11-04
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Tenancy (`BusinessInvitation`, `BusinessMembership`, `Business.SeatLimit`), Identity (contrato `IAccountProvisioner`), People (contrato `IProfessionalLinker`), Notifications (e-mail do convite)
- **Substitui:** —
- **Substituído por:** —
- **Complementa:** ADR-004 (identidade e papéis), ADR-021 (e-mail por outbox)

---

## Contexto

**Fato.** `BusinessMembership` já tinha `Invite`, `Accept` e `Remove`, e `UserTokenType.BusinessInvite` existia no enum,
mas nenhum comando, rota ou tela os usava. `Business.SeatLimit` nascia com 1, o que travaria qualquer convite.

**Fato.** `UserToken` é amarrado a um `UserId`. Quem é convidado pode ainda não ter conta.

**Decisão do produto (Arthur).** O caminho principal continua sendo o dono ou o atendente cadastrarem profissionais **sem
conta**; a conta de funcionário é um extra. Existem dois papéis convidáveis: `Professional` e `Attendant`.

## Problema

Como convidar alguém por e-mail, com link de uso único, sem criar conta nem vínculo antes de a pessoa aceitar, e sem
deixar o convite virar porta de entrada para outro estabelecimento ou para spam?

## Alternativas consideradas

1. **Reaproveitar `UserToken` e `BusinessMembership.Invite`.** Contra: exige uma conta antes do convite, o que obriga a
   criar a conta de quem pode nem querer entrar. Rejeitada.
2. **Entidade própria `BusinessInvitation`, vínculo criado só no aceite.** O convite guarda e-mail, nome, papel, o
   hash do token e as datas. Escolhida.
3. **Link com JWT assinado, sem tabela.** Contra: não dá para revogar nem reenviar, nem contar vagas. Rejeitada.

## Decisão

- `BusinessInvitation` (Tenancy, por `business_id`): e-mail normalizado, nome, papel, `ProfessionalId` opcional (sem
  chave estrangeira entre módulos), hash SHA-256 do token (índice único), validade de 7 dias, `AcceptedAt`, `RevokedAt`.
  O estado é **derivado das datas**: pendente, aceito, revogado ou expirado.
- O token bruto existe só no link do e-mail (`#/convite?token=`). As rotas públicas recebem o token **no corpo**, nunca
  na URL, para não cair em log de acesso nem em histórico do navegador.
- **Reenviar** gera token novo (o link antigo morre) e prazo novo. Convite expirado volta a ocupar vaga ao ser reenviado.
- **Vagas.** `SeatLimit` padrão 15. Ocupam vaga: vínculos `Active` e `Invited` (inclusive o dono) e convites pendentes.
  Só o Admin altera o limite. A migration leva o valor antigo 1 para 15 nas linhas existentes.
- **Aceite.** Dois caminhos: logado (a conta precisa ter o e-mail do convite, senão `invitation.email_mismatch`, 403) ou
  criando a conta (nome e senha; o e-mail do convite já conta como confirmado, porque quem abriu o link o recebeu).
  Se já existe conta com aquele e-mail, a rota de conta nova recusa (`invitation.account_exists`) e a pessoa entra.
- **Profissional** aceita o termo (`docs/legal/termo-profissional.md`): versão e data registradas no convite, **sem IP**.
  **Atendente** não aceita termo de perfil, porque não tem perfil público.
- Quem saiu ou foi removido volta pelo mesmo vínculo (`Rejoin`), com o papel do novo convite.
- Só o `Owner` convida, reenvia, revoga e lista. Limite de taxa: 30 envios por hora por conta; 20 acessos por hora por IP
  nas rotas do link.

## Consequências

**Positivas.** Nada é criado antes do aceite; o convite é revogável; vagas contadas de forma única; o `UserToken` fica
como está.

**Negativas.** Mais uma tabela e um fluxo. O aceite simultâneo do mesmo link por duas requisições depende do índice
único de `(business_id, user_id)` do vínculo para não duplicar; não há token de concorrência no convite.

**Riscos e pendências.**
- O termo do profissional é **rascunho, sem revisão jurídica**.
- Quem volta (`Rejoin`) e já tinha perfil desativado precisa ser reativado pelo dono; o aceite não reativa o perfil.
- A migration `AddBusinessInvitation` foi gerada sem banco e **não foi aplicada**; a revisão é humana.

## Referências

`docs/produto/contrato-api-frontend.md` §4.11 · `docs/legal/termo-profissional.md` · `docs/verificacao-pendente.md`
