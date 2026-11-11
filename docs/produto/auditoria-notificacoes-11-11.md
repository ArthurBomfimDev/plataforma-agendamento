# Auditoria de notificações (C1, 11/11/2026)

Auditoria do que existe no código, feita antes de decidir entre implementar o mínimo e tirar do TCC. **Decisão pela regra de corte do prompt: não implementar.** Depois da auditoria, falta bem mais de um dia de trabalho para ter e-mail de lembrete e lista in-app funcionando de ponta a ponta com teste (estimativa abaixo). O que o texto do TCC deve dizer está no fim.

## O que existe (verificado no código)

| Peça | Estado | Onde |
|---|---|---|
| Outbox | **Existe.** Entrega gravada na mesma transação do fato; worker em segundo plano; reivindicação com concessão de 5 min; recuo progressivo (30 s até 1 h) e desistência em 10 tentativas, com o payload guardado para reenvio manual. Garantia de pelo menos uma vez (ADR-021) | `OutboxMessage`, `DispatchOutboxCommand`, `OutboxWorker` |
| Envio de e-mail | **Existe.** SMTP genérico (MailKit, STARTTLS). Local: Mailpit. Demonstração pública: Gmail dedicado com senha de app, só por variável de ambiente | `SmtpEmailSender`, `compose.yaml` |
| Pedido recebido, ao estabelecimento | **Existe** (dono e, se tem login, o profissional) | `AppointmentNotifier` |
| Confirmado, recusado, cancelado pelo estabelecimento e expirado, ao consumidor | **Existe.** Autoconfirmação avisa como confirmado. Balcão sem conta não recebe | `AppointmentNotifier` |
| Cancelado pelo consumidor, ao estabelecimento | **Existe** | `AppointmentNotifier` |
| Convite para avaliar depois de concluído | **Existe** | `AppointmentNotifier` |
| `.ics` | **Existe.** Anexo na confirmação (`METHOD:REQUEST`, com alarme `VALARM` de 1 h antes) e anexo de cancelamento (`METHOD:CANCEL`, mesmo UID) | `IcsCalendar` |
| Saúde (LGPD, Art. 11) | **Existe.** Assunto e prévia não citam serviço, categoria nem estabelecimento | `AppointmentNotifier` |
| Link para o app, sem dado sensível no assunto | **Existe** | `EmailLayout` |

## O que não existe

| Peça | Estado |
|---|---|
| **Lembrete por e-mail, 24 h e 1 h antes** | **Não existe.** Não há worker, coluna de controle nem gatilho. O único lembrete real é o alarme de 1 h dentro do `.ics`, que só vale se a pessoa adicionar o evento ao calendário |
| **Lista in-app** (sino, contador de não lidas, marcar como lida) | **Não existe.** Não há tabela, endpoint nem tela. A `Notification` do modelo de domínio (`docs/produto/modelo-de-dominio.md`) nunca foi implementada |
| Tratamento do limite diário do Gmail | **Não existe.** Passando do limite, as entregas falham, recuam até 1 h e desistem em 10 tentativas |

## Defeito encontrado e corrigido

A tela "Pedido enviado" mostrava, na linha do tempo, **"Lembrete: 24 h e 3 h antes"**. Era `MOCK_REMINDER_HOURS`, dado provisório copiado do wireframe, sem envio por trás: a tela prometia ao consumidor um aviso que o sistema não manda. Corrigido: a linha agora diz **"Calendário: lembrete de 1 h antes"**, que é o que existe (o alarme do `.ics`). Divergência com a decisão de 11/11 (24 h e 1 h): o valor de 1 h agora está certo, mas só como alarme de calendário; o lembrete de 24 h não existe.

## Por que a regra de corte vale

Estimativa do que falta para cumprir o escopo mínimo com teste de ponta a ponta:

1. **Lembretes 24 h e 1 h (e-mail).** Duas colunas de controle em `appointment` (migration), um worker que varre os confirmados na janela, o e-mail, e os testes: não sair para cancelado, recusado ou expirado; não duplicar se o worker reiniciar; confirmação feita já dentro da janela; fuso. Meio dia a um dia.
2. **Lista in-app.** Tabela `notification` (migration), escrita nos 7 pontos de evento dentro da mesma transação, três endpoints (listar paginado, contar não lidas, marcar como lida) com escopo de tenant e de dono da conta, o sino no cabeçalho do consumidor e no painel, e os testes. Um a um dia e meio.
3. **Limite do Gmail.** Contador diário e adiamento da fila. Algumas horas, com decisão de política (o que priorizar).

Somando, passa de um dia e exige duas migrations, que pedem revisão humana. Não cabe nesta rodada sem escorregar nos outros itens, e o risco de entregar pela metade (lembrete duplicado ou enviado para pedido cancelado) é pior do que não ter.

## O que o texto do TCC deve dizer

**Existe e pode ser descrito como implementado:**
- E-mail transacional por Outbox transacional (a entrega é gravada na mesma transação do fato, enviada depois por um worker, com nova tentativa e recuo; garantia de pelo menos uma vez).
- Eventos com e-mail: pedido recebido (estabelecimento e profissional com conta); confirmado, recusado, cancelado pelo estabelecimento e expirado (consumidor); cancelado pelo consumidor (estabelecimento); convite para avaliar depois de concluído.
- Arquivo de calendário (`.ics`) na confirmação, com alarme de 1 h antes, e `.ics` de cancelamento que remove o evento da agenda.
- Cuidado com dado de saúde: assunto e prévia sem serviço, categoria ou estabelecimento.

**Não existe, e deve aparecer como trabalho futuro (não como funcionalidade):**
- Lembrete por e-mail 24 h e 1 h antes. **Trocar "24 h e 3 h" por: "o lembrete de 1 h existe como alarme do arquivo de calendário; lembretes por e-mail em 24 h e 1 h são trabalho futuro".**
- Central de notificações dentro do aplicativo (sino, contador, marcar como lida).
- Canal alternativo (WhatsApp) e tratamento do limite diário do provedor de e-mail.

Não escrever que o sistema "envia lembretes". O que ele envia é confirmação, e o lembrete é do calendário da pessoa.
