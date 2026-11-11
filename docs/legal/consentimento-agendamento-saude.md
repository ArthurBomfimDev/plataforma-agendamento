# Consentimento para agendar em Saúde

> ⚠️ **RASCUNHO, PENDENTE DE REVISÃO JURÍDICA.** Este texto não foi revisado por advogado. Não usar em produção antes da revisão.

- **Propósito:** `SensitiveScheduling`
- **Versão:** `2026-10-v1`
- **Onde está no código:** `ConsentTexts.SensitiveSchedulingText` (`ComplianceGateway.cs`), entregue pela `GET /api/consents/versions`.
- **Regra:** mudou o texto, muda a versão, e o consentimento antigo deixa de valer. A tela só envia a versão que exibiu, e o
  servidor recusa versão diferente da vigente (`consent.version_outdated`).

## Texto exibido

Autorizo o tratamento dos dados dos meus agendamentos em estabelecimentos de saúde (estabelecimento, profissional, serviço, data
e horário) para realizar o agendamento e enviar os avisos sobre ele. Sei que esses dados podem revelar informação sobre a minha
saúde, que é dado sensível (LGPD, Art. 11), e que o estabelecimento escolhido e a equipe dele os veem para me atender. Posso
revogar este consentimento quando quiser, em Minha conta. Revogar não cancela os agendamentos já feitos, mas impede novos pedidos
em estabelecimentos de saúde.

## Pontos para a revisão jurídica

1. O texto basta como consentimento "específico e destacado" do Art. 11, I, da LGPD?
2. Revogar não cancela os agendamentos existentes. Isso é aceitável, ou a revogação deve tratar o que já existe?
3. O texto cita quem vê os dados, mas não cita prazo de retenção nem o canal do encarregado.
4. A versão `2026-10-v1` nasceu antes do texto ser exibido em tela. Convém trocar a versão ao aprovar o texto final; quem consentiu
   antes precisará consentir de novo.
