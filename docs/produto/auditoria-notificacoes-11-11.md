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
| **Lista in-app** (sino, contador de não lidas, marcar como lida) | **Existe desde 11/11 (implementada depois da auditoria, a pedido do Arthur).** Tabela `notifications.notification` (migration `AddNotification`), gravada no mesmo `SaveChanges` de cada e-mail de agendamento; `GET /api/notifications`, `GET .../unread-count`, `POST .../{id}/read` e `POST .../read-all`; sino no cabeçalho do consumidor e do painel. Veja a seção "O sino" no fim |
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

---

## Atualização (11/11, depois do corte): lembretes por e-mail implementados

O Arthur pediu os lembretes depois da auditoria, com uma condição: **o teto de e-mails não pode influenciar confirmação, redefinição de senha nem nenhum outro aviso.** Ficou assim.

- **Quando.** Confirmado e com conta (balcão sem conta não recebe): lembrete de **1 h** na última hora, e de **24 h** de 24 h até 2 h antes. Entre 1 h e 2 h não há lembrete (o de 24 h ficaria colado no de 1 h). Quem confirma com menos de 2 h recebe só o de 1 h. Pendente, recusado, cancelado e expirado não recebem (a regra está no domínio: `Appointment.ReminderDue`).
- **Sem duplicar.** O e-mail entra na outbox e a marca "enviado" (`day_before_reminder_sent_at`, `hour_before_reminder_sent_at`) no mesmo `SaveChanges`: se o worker cair e reiniciar, ou as duas coisas existem, ou nenhuma.
- **O teto de 400.** `ReminderBudget` conta **todo** e-mail gravado nas últimas 24 h (os críticos também gastam a cota do provedor) e libera lembretes só até `App__ReminderDailyEmailBudget` (padrão 400). O lote do worker nunca passa do que cabe. **Só o lembrete consulta esse número**: `NotifyAsync` (confirmação, recusa, cancelamento, expiração, convite para avaliar) e os e-mails de conta e de convite não passam por ele, então os ~100 e-mails de folga até os cerca de 500 do Gmail ficam reservados a eles. O que passa do teto **não se perde**: fica sem marca e sai na primeira rodada com folga, se ainda estiver na janela.
- **Verificado.** 17 testes de domínio, 9 de notificador (assunto de Saúde sem nome nem serviço; orçamento esgotado não segura a confirmação nem o convite) e 6 de integração (uma rodada, duas rodadas sem repetir, janela de 1 h, fora das janelas, pendente/cancelado/recusado, balcão, e orçamento zero: lembrete para, confirmação sai). Ao vivo, na pilha local, com o worker real e o seed (300 e-mails já gravados): saíram lembretes até a outbox chegar a **400** nas últimas 24 h e pararam; **72** ficaram retidos, sem marca.
- **Ainda não existe:** adiamento de **todos** os e-mails quando o provedor estoura o limite (hoje só o lembrete respeita o teto; um e-mail crítico que o Gmail recusar recua e desiste em 10 tentativas, como antes). O limite de ~500/dia do Gmail é conhecimento externo, **não verificado**.
- **Migration** `AddAppointmentReminderMarks` (duas colunas nulas em `scheduling.appointment`): revisão humana.

## O sino (lista in-app), implementado depois da auditoria

Feito a pedido do Arthur em 11/11, depois da regra de corte ter dito para não implementar.

- **Dado.** `notifications.notification`: `user_id`, `audience` (`Customer` ou `Business`), `business_id` (só no lado do estabelecimento), `type`, `appointment_id`, `title`, `body`, `occurred_at`, `read_at`. Sem chave estrangeira (os ids são de outros módulos) e fora do tenant: o aviso é da pessoa. Dois índices: a lista por pessoa e lado, e um parcial só com as não lidas, que o contador consulta a cada minuto.
- **Quem escreve.** O `AppointmentNotifier`, nos mesmos pontos dos e-mails e no mesmo `SaveChanges`: consumidor recebe confirmado, recusado, cancelado pelo estabelecimento, expirado, convite de avaliação e os lembretes de 24 h e 1 h; o dono e o profissional com login recebem pedido novo e cancelamento pelo consumidor. Balcão sem conta não tem para quem.
- **Saúde (LGPD, Art. 11).** Título e texto são o assunto e a prévia do e-mail, que já não citam serviço, categoria nem nome do estabelecimento. Teste de unidade cobre.
- **Lado.** Vem do token: com estabelecimento ativo lê o sino do painel daquele estabelecimento; sem, o do consumidor. Quem troca de contexto troca de sino. Aviso de outra pessoa ou do outro lado devolve 404 (não confirma que existe).
- **O sino não conta no teto de e-mail.** O teto de 400 em 24 h só segura lembrete por e-mail; o aviso no aplicativo é gravado de qualquer forma.
- **Não feito.** Push (nada além da lista dentro do app); expurgo de avisos antigos (a lista mostra os 20 mais novos, a tabela cresce); apagar os avisos de quem exclui a conta (a tabela não tem política de retenção ainda). Os dois últimos precisam de decisão.
- **Verificado.** Testes de unidade e de integração (N1–N7: lado, leitura idempotente, marcar todas, 404 de outro dono, 401 sem sessão, paginação), componente com `renderToString`, migration aplicada em pilha nova e fluxo conferido no navegador: agendar como consumidor, ver o contador, abrir, ir aos agendamentos, contador zerar. **Não visto** em aparelho real nem no painel do dono pela tela (só por teste de integração).