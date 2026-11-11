# Nota de atualização do TCC, 11/11/2026

Só lista o que mudou no sistema e propõe o texto. **Não edita o texto do TCC.** O texto do TCC não está nesta branch (vive em `docs/tcc-escrita`), então as seções abaixo são citadas pelo tema, e a 3.2 pelo número que o prompt deu: confira o número e o trecho exato antes de aplicar.

Regra: tudo aqui foi verificado no código ou em teste desta branch. O que não foi verificado está marcado **não verificado**.

---

## 1. Limitação da "tela de horário tomado" (seção 3.2)

**O que era.** Qualquer horário fora da lista que o calculador oferecia saía como `appointment.slot_no_longer_available` (409), "esse horário acabou de ser ocupado". Em 11/11 isso apareceu com a agenda livre: as 11:45 caíam na antecedência mínima (09:45 + 2 h) e as 13:00 do balcão caíam no intervalo de almoço da jornada.

**O que mudou (A1).**
- `AvailabilityCalculator.Diagnose` devolve o motivo da recusa. Só o horário realmente ocupado continua sendo 409. Os outros são 422, cada um com código próprio e com `alternatives`: grade, feriado, fora da jornada, folga/férias/bloqueio, horizonte e antecedência mínima.
- A tela mostra uma mensagem diferente para cada motivo. Ao receber qualquer recusa de horário, a revisão do pedido volta ao calendário, que busca os horários de novo.
- Teste de propriedade: todo horário que o calculador oferece é aceito no agendamento online e no de balcão, com buffer 0, 10/10, 0/15 e 15/0, e colado em outro agendamento.
- A suíte de concorrência (50 requisições simultâneas, grupo A) continua passando: nenhuma dupla reserva.

**Texto proposto.** "Quando o horário escolhido deixa de estar disponível, o sistema informa o motivo — horário ocupado por outro agendamento, fora do expediente do profissional, folga ou bloqueio, antecedência mínima, ou data além do período de agendamento — e leva o consumidor de volta à lista de horários atualizada."

**A limitação que continua.** A tela não destaca, na lista, os horários vizinhos que a API devolve em `alternatives` depois de um 409. O texto da limitação pode sair **só** na parte "a mensagem não distinguia o motivo"; a parte "não sugere alternativa na própria tela" permanece.

---

## 2. Lembretes e notificações (C1)

**Estado real (auditado e depois implementado; `docs/produto/auditoria-notificacoes-11-11.md`).**
- Existe: e-mail transacional por Outbox transacional (gravado na mesma transação do fato, enviado por worker, com nova tentativa e recuo, garantia de pelo menos uma vez); e-mails de pedido recebido, confirmado, recusado, cancelado pelo estabelecimento, expirado, cancelado pelo consumidor e convite para avaliar; arquivo `.ics` na confirmação, com alarme de 1 h antes, e `.ics` de cancelamento.
- **Existe desde 11/11:** lembrete por e-mail ao consumidor **24 h e 1 h antes** de um horário **confirmado**. O de 24 h sai entre 24 h e 2 h antes (quem confirma já em cima da hora recebe só o de 1 h). Não sai para pedido pendente, recusado, cancelado ou expirado, nem para balcão sem conta, e cada lembrete sai uma vez só. Há um teto de e-mails nas últimas 24 h (padrão 400) que **só** segura lembretes: confirmação, redefinição de senha e os demais avisos nunca são contidos por ele.
- **Não existe:** lista de notificações dentro do aplicativo (sino, contador, marcar como lida); adiamento geral de e-mail quando o provedor atinge o limite.

**Texto proposto.** "O sistema envia ao consumidor, por e-mail, um lembrete 24 horas e outro 1 hora antes de um agendamento confirmado, além da confirmação com arquivo de calendário. Para respeitar o limite diário do provedor de e-mail, o envio de lembretes é suspenso quando o volume das últimas 24 horas atinge um teto configurável, sem nunca reter a confirmação, a redefinição de senha ou outros avisos transacionais. Uma central de notificações dentro do aplicativo é trabalho futuro."

Os "24 h e 3 h" do texto antigo ficam como **"24 h e 1 h"**, que agora é o que o sistema faz. A tela "Pedido enviado" mostrava "24 h e 3 h" sem envio por trás; hoje mostra "24 h e 1 h antes, por e-mail" e é verdade.

**Evidência (para o TCC, com ressalva).** 6 testes de integração e 26 de unidade cobrem os lembretes e o teto. Na pilha local com o worker real e o seed, os lembretes saíram até a outbox somar 400 e-mails em 24 h e pararam, com 72 retidos. **Não** é teste de entrega em Gmail real: o limite do Gmail (cerca de 500 por dia) é conhecimento externo, **não verificado**, e nenhum envio real foi feito.

**Google Agenda.** O app já oferece "Adicionar à agenda" para Google (link de criação de evento pré-preenchido, sem OAuth), Outlook e `.ics`. O link do Google não define lembrete; **não verificado** se o Google respeita o alarme do `.ics` ao importar. Não afirmar que o Google Agenda "recebe o lembrete de 1 h"; o lembrete de 1 h garantido é o do e-mail.

---
## 3. Máscaras de CEP e CPF/CNPJ (B1)

Máscara de CEP (`00000-000`) e de CPF (`000.000.000-00`) / CNPJ (`00.000.000/0000-00`), num módulo só, com validação do dígito verificador ao sair do campo. A API recebe só os caracteres puros. O CNPJ alfanumérico (IN RFB 2.229/2024, em vigor desde 31/07/2026) é aceito: letras nas 12 primeiras posições.

**Texto proposto.** "Os campos de CEP e de documento aplicam máscara durante a digitação e conferem o dígito verificador ao sair do campo; o sistema aceita o CNPJ alfanumérico adotado pela Receita Federal em 2026." (Não citar como evidência de usabilidade: não houve teste com usuário.)

---

## 4. Seletor de hora próprio (A4)

O `<input type="time">` nativo foi trocado por um componente próprio (`TimeField`): lista de horários de 15 em 15 minutos, rótulo visível, alvo de toque de 44 px, fonte de 16 px. Motivo: no Chrome do Android o seletor nativo abre com o botão "Definir" cortado na borda, e sem ele não se confirma o horário. A causa **não** foi estouro horizontal da página (medido em 360 e 390 px: não há).

**Texto proposto.** "Os campos de horário usam uma lista própria em passos de 15 minutos — a granularidade padrão do produto —, no lugar do seletor nativo do navegador, cujo tamanho e comportamento variam entre aparelhos."

**Verificação.** Testes de componente e conferência no navegador do app em 360, 390 e 1280 px. **Não verificado** no Android real do Arthur.

**Defeito conhecido, para "limitações".** A jornada não fecha à meia-noite: o fim 00:00 é recusado (`end_time > start_time` no domínio e no banco); quem fecha à meia-noite grava 23:59 e perde 1 minuto.

---

## 5. Vitrine do estabelecimento (B2)

A página pública do estabelecimento passou a mostrar até 3 fotos dele (a primeira é a capa): grade de 3 no computador, faixa que rola no celular, texto alternativo em cada foto, ilustração padrão da categoria quando não há foto. O dono envia, troca, remove e reordena no painel. Antes, as duas fotos menores eram um retângulo cinza.

**Texto proposto.** "A página pública do estabelecimento exibe até três fotografias, gerenciadas pelo proprietário; a primeira é também a imagem de capa usada nos resultados de busca."

**Migration** `AddBusinessGalleryPhotos` (duas colunas nulas): revisão humana pendente.

---

## 6. Imagens de demonstração e créditos (B3)

**Estado.** As imagens de banco de imagem **não foram baixadas** (os bancos bloqueiam o ambiente automatizado). Estão prontos a lista de 45 arquivos, o `CREDITS.md` (tabela em branco) e um verificador, em `scripts/seed-assets/`. O seed de demonstração, sem esses arquivos, **gera** uma imagem por código (gradiente e iniciais), de autoria do projeto.

**Texto proposto, enquanto não houver crédito.** "As imagens do ambiente de demonstração são geradas pelo próprio sistema e não representam estabelecimentos reais." **Só depois** de baixar as fotos e preencher o `CREDITS.md` é correto escrever que elas vêm de banco de imagens e listar autor, URL, licença e data no apêndice. Nunca preencher a tabela de memória.

---

## 7. PWA e Tauri (C2)

**PWA.** Mesclado em `feat/demo-publica` (11/11): manifest, ícones (192, 512 e *maskable*), registro do service worker e aviso de atualização, com testes. O ambiente final de demonstração publica o `web` por Tailscale Funnel (`compose.demo.yaml`) com banner "dados fictícios".

**Tauri.** **Não avaliado nesta rodada** (o C2 foi dispensado). A decisão de 07/10 continua valendo: o Tauri segue como trabalho futuro. Não foi medido nem testado; não escrever que "foi avaliado e descartado", apenas que está fora do escopo.

---

## 8. Outros pontos que o texto pode precisar

- **Foto do profissional.** Aparecia só onde o profissional é o assunto da tela. Agora há um componente único (`ProfessionalAvatar`) e a foto aparece também nos serviços, na agenda, nas jornadas e nos bloqueios.
- **Endereço (A2).** O cadastro de endereço desce do endereço completo até o município quando a rua não está no mapa; o ponto aproximado vem com aviso. O mapa para o dono arrastar o pino **não existe** (a política de segurança do site não permite mapa embutido): é trabalho futuro. Em cidade pequena (Duartina/SP, 11/11), o ViaCEP e a BrasilAPI achavam a rua, mas o OpenStreetMap só conhecia o município.
- **Responsividade (C3).** Medição em 390, 768 e 1280 px de 23 rotas, sem estouro horizontal. Não foi feita com Playwright nem em aparelho real; não citar como teste de acessibilidade ou de usabilidade.
