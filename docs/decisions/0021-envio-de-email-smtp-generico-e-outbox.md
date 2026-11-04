# ADR-021 — Envio de e-mail: SMTP genérico e outbox

- **Status:** Proposto
- **Data:** 2026-10-28
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Notifications (novo, com código), Identity, Scheduling, Tenancy, People
- **Substitui:** —
- **Substituído por:** —
- **Complementa:** ADR-010 (decisão 7: o Outbox na mesma transação é a fila)

---

## Contexto

**Fato.** Até a Onda 5A, o `IIdentityMailer` era o `LoggingIdentityMailer`: a confirmação de e-mail e a redefinição de
senha só registravam o token no log. A tela "Pedido enviado" promete aviso que não existia (pendência U).

**Fato.** A ADR-010 (decisão 7) já diz que não há barramento de mensagens e que a outbox, na mesma transação da escrita,
é a fila. As decisões de 22/09 preveem uma tabela `outbox` genérica, "infraestrutura e não domínio", e a entidade
`Notification` para o in-app (Onda 5C).

**Fato.** Os provedores de e-mail transacional que cabem no orçamento (Resend, Brevo, Gmail com senha de app) falam SMTP.

**Fato.** Em Saúde, o próprio agendamento é dado sensível (LGPD, Art. 11). O assunto do e-mail aparece na lista da caixa
de entrada e, no celular, na tela bloqueada; o nome de uma clínica costuma dizer a categoria.

## Problema

Como enviar e-mail sem perder aviso quando o provedor falha, sem mandar aviso de uma escrita que não aconteceu, sem
prender a requisição ao provedor e sem amarrar o código a um provedor?

## Alternativas consideradas

### A — Enviar dentro da requisição, depois do `SaveChanges`

**A favor:** simples.
**Contra:** provedor lento atrasa a resposta; provedor fora do ar perde o aviso (a escrita já foi); e se o envio vier
antes da gravação, um e-mail sai para uma escrita que falhou depois.

### B — Barramento de mensagens (RabbitMQ, MassTransit)

**A favor:** entrega e nova tentativa resolvidas pelo barramento.
**Contra:** proibido pela ADR-010 (decisão 7), e o `ForbiddenDependencyTests` reprova. Infraestrutura nova para um
problema que uma tabela resolve nesta escala.

### C — Outbox na mesma transação, worker que envia por SMTP genérico

**A favor:** o aviso existe se e só se a escrita existe; a requisição não espera o provedor; nova tentativa com recuo;
o provedor é configuração.
**Contra:** o envio é assíncrono (segundos, não instantâneo); a garantia é "pelo menos uma vez", não "exatamente uma".

### D — SDK de um provedor (Resend, SendGrid)

**A favor:** recursos do provedor (webhooks de entrega, modelos).
**Contra:** trocar de provedor vira mudança de código. Sem necessidade dos recursos extras no MVP.

## Decisão

Adotamos **C**, com SMTP genérico (MailKit).

- **Outbox genérica.** Tabela `notifications.outbox` (migration `AddOutbox`, aditiva), uma linha por entrega, com
  `type` (hoje só `email`) e `payload` (`jsonb`). A Onda 5C acrescenta tipos sem mudar a tabela. Preferimos a tabela
  genérica das decisões de 22/09 a uma tabela só de e-mail: o lembrete e o push vão entrar pelo mesmo caminho.
- **Mesma transação.** Quem gera o aviso o põe na outbox (`IEmailOutbox.Enqueue`) **antes** do `SaveChanges` do fato. Se
  a gravação é recusada (horário tomado, toque duplo), o aviso não existe. Nunca há envio dentro da requisição.
- **E-mail montado na hora do fato.** O assunto, o HTML, o texto e o `.ics` vão prontos no `payload`, com os dados do
  momento. Sem motor de templates (decisões de 22/09, §6.2): um layout só, HTML simples com versão em texto, sem
  imagem externa, todo texto de fora com escape. A marca vem de `App__BrandName` (padrão Vagoo).
- **Worker.** O `OutboxWorker` roda a cada 5 s. O `DispatchOutboxCommand` reivindica até 50 linhas vencidas numa
  instrução só (`UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED) RETURNING *`), com reserva de 5 minutos: duas
  instâncias nunca pegam a mesma linha. Cada resultado é gravado logo depois do envio.
- **Nova tentativa.** Falha incrementa `attempts` e empurra `next_attempt_at`: 30 s, 1 min, 2 min, 4 min… até 1 h. Na
  10ª falha a linha é marcada `failed_at` e o `payload` fica, para reenvio manual.
- **Idempotência.** Linha processada (`processed_at`) não volta à fila. A garantia é "pelo menos uma vez": se o processo
  cair entre o envio e a gravação, a linha volta a vencer depois da reserva e sai de novo, com o **mesmo
  `Message-ID`** (derivado do id da linha), o que permite reconhecer a repetição.
- **Payload apagado.** Processada, a linha perde o `payload` (vira `{}`): o link de confirmação e o de redefinição de
  senha levam token de uso único, e não ficam guardados no banco depois de entregues.
- **SMTP genérico.** `Email__Smtp__Host`, `Port`, `User`, `Password`, `UseSsl`, `Email__From`, `Email__FromName`;
  `App__PublicBaseUrl` para os links. **Sem SMTP configurado, a API não sobe fora de Development** (`ValidateOnStart`):
  nunca cai em silêncio para "só log" em produção. Em Development, o padrão é o Mailpit local (`localhost:1025`), que
  está no `compose.yaml`.
- **Revogação do certificado (31/10).** `Email__Smtp__CheckCertificateRevocation` (padrão `true`) vai para
  `SmtpClient.CheckCertificateRevocation`. Observado no Gmail: o MailKit tenta baixar a CRL do certificado
  (`c.pki.goog`) e, quando o DNS da rede não a resolve, o handshake falha com "unable to get certificate CRL". Com
  `false`, a cadeia e o nome do servidor continuam validados e o STARTTLS segue obrigatório; só a consulta de
  revogação é dispensada. **Trade-off:** perde-se a garantia contra certificado revogado, aceitável numa demonstração
  com servidor conhecido. Em produção real, libere a saída para a CRL e mantenha `true`. Diagnóstico em
  `docs/operacao/demo-publica.md`.
- **Saúde.** Assunto e prévia (`Preheader`) **não citam serviço, categoria nem o nome do estabelecimento**. O corpo, para
  o próprio titular ou para a equipe que o atende, traz os detalhes. No `.ics`, o título é "Atendimento — {nome}", sem
  o serviço.
- **O `LoggingIdentityMailer` sai.** O token não vai para log em ambiente nenhum.

### Quem recebe o quê

| Gatilho | Destinatário |
|---|---|
| Cadastro | a própria conta (link de confirmação) |
| Esqueci a senha | a própria conta (link de redefinição) |
| Pedido criado, pendente | donos ativos e o profissional, se tem login |
| Pedido criado, já confirmado (autoconfirmação) | consumidor, com `.ics` |
| Confirmado | consumidor, com `.ics` |
| Recusado, cancelado pelo estabelecimento (inclusive pelo bloqueio de período), expirado | consumidor |
| Cancelado pelo consumidor | donos ativos e o profissional, se tem login |

Balcão sem conta não gera aviso ao consumidor. Concluir e marcar falta não geram aviso.

## Consequências

### O que fica mais fácil

- Trocar de provedor é trocar variáveis de ambiente.
- A requisição não depende do provedor estar no ar.
- O teste confere o e-mail sem rede: o canal de envio é uma porta (`IEmailSender`) e o teste usa um canal falso.

### O que fica mais difícil

- O e-mail chega alguns segundos depois da ação, não na hora.
- Uma queda entre o envio e a gravação pode repetir um e-mail (pelo menos uma vez).
- A outbox guarda, até a entrega, dados pessoais e links com token; o banco passa a ter mais dado sensível em trânsito.
  Linhas processadas perdem o conteúdo; as que falharam de vez o mantêm, para reenvio.
- Não há aviso de entrega nem de devolução (bounce): o SMTP genérico só diz que o servidor aceitou.

### O que passa a ser proibido

- Enviar e-mail de dentro de uma requisição.
- Chamar o `IEmailOutbox` depois do `SaveChanges` do fato que gerou o aviso.
- Pôr serviço, categoria ou nome do estabelecimento no assunto ou na prévia de um aviso de Saúde.
- Registrar em log o token de confirmação ou de redefinição.

## Divergência registrada

As decisões de 22/09 chamam a `outbox` de "infraestrutura, não domínio". No código, a entidade `OutboxMessage` mora no
Domain (`Booking.Domain.Entity.Module.Notifications`), porque a ADR-010 (decisão 5) só deixa o EF mapear entidade de
domínio, e o `PersistenceMappingTests` reprovaria uma entidade só de infraestrutura. A tabela continua sendo a `outbox`
genérica prevista.

## Premissa não verificada

**O provedor escolhido aceita SMTP com a taxa de envio do MVP.** Nenhum provedor real foi configurado nem testado:
todos os testes usam o canal falso, e o ambiente local usa o Mailpit. Limites de envio, reputação do domínio (SPF,
DKIM, DMARC) e entregabilidade não foram medidos.

## Como saber que erramos

- Se e-mails importantes chegarem atrasados demais para serem úteis (lembrete de 1 h, Onda 5C).
- Se repetições por queda entre envio e gravação aparecerem com frequência.
- Se a falta de aviso de devolução esconder um provedor que recusa em silêncio.

## Referências

- ADR-010 (decisões 5 e 7) · `docs/produto/decisoes-localizacao-notificacao-modelo.md` §6
- `backend/src/Core/Booking.Application/Module/Notifications/` — `DispatchOutboxCommand`, `AppointmentNotifier`,
  `IdentityMailer`, `Email/`
- `backend/src/Infrastructure/Booking.Infrastructure/Module/Notifications/` — `SmtpEmailSender`, `OutboxRepository`
- `backend/tests/Booking.IntegrationTests/Notifications/EmailTests.cs` — M1 a M13
