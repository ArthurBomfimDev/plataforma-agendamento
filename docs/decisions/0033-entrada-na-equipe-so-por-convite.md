# ADR-033: entrada na equipe só por convite

## Status

**Aceito em 10/11/2026, aprovada por Arthur.** Proposto em 05/11/2026, como padrão "até eu decidir" na rodada 2 do PR #58.

A parte 6 (trajeto de quem tem conta sem e-mail confirmado) e a opção sobre a confirmação do e-mail pelo convite foram
acrescentadas em 10/11/2026 e **tocam autenticação: exigem revisão humana**.

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
6. **A especialidade vai no convite** (10/11). A coluna `tenancy.business_invitation.specialty` (texto, até 80 caracteres,
   nula) guarda o que o dono informou. No aceite, o perfil nasce com ela; se for nula (convite antigo), nasce com o rótulo
   "Profissional". O dono e o profissional podem editá-la depois. Para o atendente, que não tem perfil, a API descarta o
   valor sem erro. Acima de 80 caracteres: 400 `invitation.specialty_invalid`. A tela pede a especialidade, obrigatória, só
   para o papel Profissional que vai ganhar perfil novo; ligando a conta a um registro antigo, o perfil já tem a sua e o
   campo some.

A declaração do dono não é gravada no convite, porque não é exigida nesse caminho: quem aceita tem conta e controla os
próprios dados (ADR-031). Ela continua valendo para os registros antigos, sem conta.

## Quem abre o link do convite: três situações

A conta é única; o papel vem do vínculo. Não existe tipo de conta "só funcionário".

| Situação | O que acontece |
|---|---|
| **Sem conta** | `#/convite` mostra "Criar conta" com o e-mail do convite fixo. `POST /api/invitations/accept-new-account` cria a conta **com o e-mail já confirmado** e aceita, e o frontend entra com as mesmas credenciais. O link recebido no próprio e-mail é a prova de que a pessoa tem a caixa postal. Não há viagem de volta. |
| **Conta confirmada** | Entra pelo link ("Entrar" leva o `redirect` de volta ao convite) e aceita. |
| **Conta existente, e-mail ainda não confirmado** | O login é recusado (403 `identity.email_not_confirmed`); abrir o convite não confirma nada. A pessoa confirma o e-mail e entra, e o login a leva de volta ao convite. |

O trajeto da terceira linha depende do destino sobreviver à confirmação, porque o link do e-mail de confirmação não o carrega:

- Quando o login é recusado por falta de confirmação, ou a pessoa pede o reenvio, o frontend guarda o destino
  (`/convite?token=…`) **neste aparelho** (`localStorage`, chave `vagoo.next-after-confirmation`), junto com o e-mail digitado.
- No primeiro login com o mesmo e-mail, em até 48 horas, o destino é lido, conferido de novo pela lista fechada de caminhos
  (`safeNext`, ADR-034) e apagado ao entrar. Outro e-mail, no mesmo navegador, não o recebe.
- **O token não vai a log:** a API o recebe no corpo de `POST` (nunca na URL) e o frontend não o escreve em log. **Nem a URL
  externa:** o destino é rota interna do `#`, que o navegador não envia ao servidor, e `safeNext` recusa qualquer destino fora
  da lista. O armazenamento é o do próprio aparelho de quem recebeu o convite.
- O convite vale 7 dias e o destino guardado, 48 horas. Passado esse prazo, ou sem armazenamento (aba anônima), a pessoa abre
  de novo o link do e-mail do convite, que continua válido.
- A prova de API está em `InvitationJourneyTests.J5`: conta sem confirmação, login recusado, confirmação, login e aceite.

## Consequências

- Registros antigos sem conta continuam válidos e podem ser ligados a uma conta por um convite (`professionalId`).
- Quem trabalha sem e-mail não entra mais na equipe. Se isso for um problema real para o autônomo com ajudante, a decisão
  precisa ser revista.
- O seed de demonstração cria os profissionais fictícios por SQL, só no banco local do Docker, e traz um convite de
  profissional pendente com especialidade.
- Migration `AddInvitationSpecialty` (**NÃO APLICADA**): `ALTER TABLE tenancy.business_invitation ADD specialty character
  varying(80);`. Convites anteriores ficam com nulo.

## Para o Arthur decidir

**Confirmar o e-mail pelo convite, sim ou não.** Hoje, a criação de conta pelo convite já marca o e-mail como confirmado
(ADR-029, `accept-new-account`), porque o token chegou por aquele e-mail. Isso **não foi alterado** nesta rodada. As opções:

1. **Manter (estado atual).** Quem não tem conta aceita na hora, sem passar pela confirmação. É o caminho mais curto e a
   prova de posse da caixa postal é o próprio token de uso único, de 7 dias.
2. **Exigir a confirmação normal.** A conta nasce sem confirmação, o e-mail de confirmação sai como no cadastro comum, e a
   pessoa volta ao aceite pelo destino guardado. É mais estrito, mas acrescenta uma viagem a quem já provou a posse do e-mail
   ao abrir o convite, e o destino guardado pode se perder (outro navegador, mais de 48 horas).

Escolher a opção 2 muda `AcceptInvitationWithNewAccountCommand` e os testes `I1` a `I5`: é mudança de autenticação, com revisão
humana.
