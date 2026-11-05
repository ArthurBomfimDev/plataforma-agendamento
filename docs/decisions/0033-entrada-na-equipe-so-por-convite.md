# ADR-033: entrada na equipe só por convite

## Status

Proposto (05/11/2026). Padrão definido pelo Arthur na rodada 2 do PR #58, "até eu decidir".

## Contexto

Até aqui o dono cadastrava um profissional sem conta, e o convite (ADR-029) era um extra. O teste de 05/11 mostrou dois
problemas nesse desenho:

- O registro de profissional podia nascer sem a pessoa saber. O dono precisava declarar a autorização dela (ADR-031).
- Existiam dois caminhos para a mesma pessoa, e o papel de acesso se confundia com o perfil público. Um convite feito com o
  papel pré-marcado deixou uma pessoa com agenda vazia, perfil público e "Meu perfil" de profissional.

## Decisão

1. Outra pessoa só entra na equipe por convite. `POST /api/businesses/current/professionals` aceita apenas `isMe: true`, o
   perfil do próprio dono que também atende. Com `isMe: false` responde 409 `professional.cannot_create_without_invitation`.
2. O registro de profissional nasce no aceite de um convite de papel Profissional.
3. O atendente nunca tem registro de profissional: não aparece em Profissionais, na página pública nem nas colunas da agenda.
4. A seção Equipe lista as contas com o papel. Profissionais lista só quem tem perfil público.
5. O formulário de convite não traz papel marcado: a escolha é obrigatória.

A declaração do dono não é gravada no convite, porque não é exigida nesse caminho: quem aceita tem conta e controla os
próprios dados (ADR-031). Ela continua valendo para os registros antigos, sem conta.

## Consequências

- Registros antigos sem conta continuam válidos e podem ser ligados a uma conta por um convite (`professionalId`).
- A especialidade não entra no convite nesta rodada: guardá-la exige coluna nova em `tenancy.business_invitation`, e a
  migration autorizada foi só a de `Service`. O dono ou o profissional preenchem depois do aceite.
- Quem trabalha sem e-mail não entra mais na equipe. Se isso for um problema real para o autônomo com ajudante, a decisão
  precisa ser revista.
- O seed de demonstração cria os profissionais fictícios por SQL, só no banco local do Docker.
