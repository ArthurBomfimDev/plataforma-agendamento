# ADR-028 — Ciclo de status do estabelecimento, publicação por categoria e a separação entre publicar e receber

- **Status:** Proposto
- **Data:** 2026-11-04
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Tenancy (`Business`, rotas do dono e do Admin), Notifications (e-mails de status, pendente)
- **Substitui:** —
- **Substituído por:** —
- **Complementa:** ADR-020 (Admin da plataforma), ADR-021 (e-mail por outbox)

---

## Contexto

**Fato.** O estabelecimento nasce em rascunho (`Draft`) e só vai a `PendingReview` pelo `Submit`, depois do Admin
aprovar (`Active`). Isso serve a Saúde, em que alguém precisa conferir o registro no conselho. Para Beleza, obrigar a
fila de análise humana atrasa a entrada de quem só quer abrir a agenda.

**Fato.** Não havia onde guardar o motivo e o autor de uma suspensão, o responsável de Saúde nem o aceite dos termos.

**Fato.** Pagamento está fora do MVP (`IPaymentGateway` sem adaptador).

## Problema

Como deixar o dono publicar rápido onde o risco é baixo, manter a análise humana onde o risco é alto, e não misturar
"aparecer na plataforma" com "receber dinheiro"?

## Alternativas consideradas

1. **Toda categoria passa pela análise do Admin.** Simples e igual para todos. Contra: não escala para o Admin sozinho e
   trava o caso de baixo risco (Beleza).
2. **Toda categoria publica na hora.** Rápido. Contra: Saúde exposta sem conferência do registro (LGPD, Art. 11; o próprio
   agendamento já é dado sensível).
3. **Publica na hora onde a categoria não é sensível; Saúde envia para análise (escolhida).**

## Decisão

Alternativa 3.

- **Status:** `Draft` → (Beleza e, no futuro, Bem-estar) `Publish()` → `Active`; (Saúde) `Submit()` → `PendingReview` →
  `Approve()` → `Active`. `Suspended` e a volta com `Reactivate()`. A reprovação do Admin devolve ao `Draft` com
  `VerificationLevel.Rejected` e o motivo em `VerificationNote`; **não há status novo `Rejected`**: a tela mostra
  "Reprovado" a partir dessa combinação, e o dono corrige e reenvia.
- **Quem decide:** a categoria sensível é `BusinessCategory.RequiresSensitiveHandling()` (hoje só Saúde). `Publish()` em
  categoria sensível recusa com `business.requires_review`.
- **Checklist de envio e de publicação** (a mesma): termos aceitos (`terms`), localização confirmada, ao menos 1
  profissional ativo, 1 serviço com profissional habilitado, 1 jornada, e, em Saúde, o responsável (`responsible`). O
  servidor recusa com `business.activation_checklist_incomplete` e a lista do que falta.
- **Em análise:** o dono pode configurar tudo; nada fica público nem agendável (`IsBookable` é só `Active`).
- **Motivo e autor:** suspender exige o motivo e grava quem decidiu e quando. O dono lê o motivo (suspensão ou
  reprovação) em `StatusReason`.
- **Responsável de Saúde** (nome, conselho CRM/CRP/CREFITO/CRN/CREFONO/CRO, número e UF): obrigatório em Saúde, **só o
  Admin lê**; o dono recebe apenas "informado". Nunca em resposta pública nem em log. A conferência no portal do
  conselho é manual.
- **Freios:** e-mail confirmado (o login já exige), no máximo 3 estabelecimentos por conta, suspensão pelo Admin com
  registro. Taxa de criação e a fila de denúncias entram em seguida.

### Documento do cadastro: Versão B (Arthur, 04/11)

**Toda categoria aceita CPF ou CNPJ.** O passo do documento pergunta "Empresa (CNPJ)" ou "Autônomo(a) (CPF)"; MEI usa CNPJ.

**Por quê:** exigir CNPJ deixaria de fora o autônomo informal, que é o público do problema estudado no TCC (o barbeiro, a
manicure, quem trabalha sozinho). A Versão A (CNPJ obrigatório) foi descartada por isso. O CNPJ continua incentivado no
próprio passo, porque ele prepara o portão de receber descrito abaixo.

- `document_type` (`Cpf` ou `Cnpj`) sai do documento, e o tipo declarado no assistente é conferido no servidor
  (`document.expected_cpf`, `document.expected_cnpj`). `is_mei` é informativo, declarado pelo dono, e só existe com CNPJ
  (`business.mei_requires_cnpj` e a constraint `ck_business_mei_requires_cnpj`). A plataforma não confere se a pessoa é MEI.
- Saúde não muda: além do documento, o responsável, o conselho, o número e a UF, e a análise do Admin.
- O documento nunca é público nem vai para log; só o dono e o Admin veem. Um documento não se repete entre estabelecimentos
  (índice único).

### Publicar é diferente de receber

O status só diz respeito a **aparecer na plataforma**. Quando houver pagamento, **receber** será um segundo portão,
independente: onboarding e verificação de identidade no provedor de pagamento. Um estabelecimento `Active` não recebe
dinheiro por isso, e a reprovação no provedor não despublica. O tipo de documento guardado servirá a esse fluxo.

## Consequências

- **Mais fácil:** o dono de Beleza publica na hora; o Admin só vê Saúde (e as denúncias).
- **Mais difícil:** Beleza publica sem conferência humana; o freio é o limite por conta, as denúncias e a suspensão.
- **Proibido:** responder o registro do conselho fora do Admin; publicar Saúde sem passar por `Approve()`.

## Premissa não verificada

A migration `AddOnboardingFields` e as rotas novas foram escritas **sem Docker** e não foram aplicadas nem exercitadas
pelos testes de integração (ver `docs/verificacao-pendente.md`).

## Como saber que erramos

- Se um estabelecimento de Beleza abusivo permanecer público tempo demais (a suspensão é reativa).
- Se o Admin acumular fila de Saúde que não consegue conferir à mão.

## Referências

- `Business.Publish`, `Submit`, `Approve`, `Suspend`, `SetResponsible`, `AcceptTerms`
- `PublishBusinessCommand`, `AdminBusinessCommands`, `ActivationChecklist`
- `backend/tests/Booking.IntegrationTests/Tenancy/OnboardingTests.cs` (P1 a P7, não rodados)
