# ADR-013 — CPF opcional e verificação de identidade como porta

- **Status:** Proposto
- **Data:** 2026-10-26
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** People, Compliance, Scheduling
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

**Fato.** Decisão de 22/09 (`docs/produto/decisoes-localizacao-notificacao-modelo.md` §2.2 e §2.3), ainda
sem ADR.

**Fato.** O dígito verificador do CPF é público e um gerador de CPF válido é trivial. CPF guardado sem
consulta a uma base oficial não identifica ninguém: só transfere ao projeto a responsabilidade de guardar o
identificador mais sensível do país.

**Fato.** Consultar a base oficial tem custo por consulta. O projeto já decidiu não fazer isso nem para o
CNPJ do estabelecimento, que é verificado por formato e dígito, offline, e depois manualmente pelo `Admin`.

**Fato.** Sem pagamento no MVP (decisão 8), não há cartão como âncora de identidade. A janela sem cartão e
sem CPF verificado coincide com a janela do MVP, que é uma demonstração controlada, sem tráfego real.

**Fato.** A fraude possível sem pagamento é falta, bloqueio de agenda por conta falsa e fuga de
banimento. A aprovação manual como padrão já neutraliza o bloqueio de agenda por conta falsa.

**Fato, estado do código em 26/10.** O `Customer` ainda não tem `Cpf` — há só o comentário de que ele
entra com o fluxo da vertical de saúde. A porta `IIdentityVerificationProvider` **não existe no código**.

## Problema

Coletar CPF de todo consumidor protege o sistema de fraude o suficiente para justificar o risco de guardar
o dado?

## Alternativas consideradas

### A — CPF obrigatório no cadastro, sem verificação

**A favor:** um campo a mais, nenhum custo de integração.
**Contra:** não previne fraude (o CPF pode ser gerado ou de terceiro) e assume todo o risco de guardar o
dado. Pior das duas opções.

### B — CPF obrigatório e verificado na base oficial, como faz a Uber

**A favor:** é o controle que de fato funciona — a Uber pede CPF e data de nascimento e valida contra a
base do governo, principalmente para quem paga em dinheiro, ou seja, para quem não tem cartão como âncora.
**Contra:** custo por consulta; inverteria a prioridade, já que nem o CNPJ do estabelecimento é consultado;
seria construído para uma janela (sem cartão) que fecha sozinha quando o pagamento entrar.

### C — CPF opcional, pedido só quando há finalidade, e verificação como porta sem adaptador

**A favor:** o CPF só é coletado onde há finalidade clínica — identificar o paciente na vertical de saúde —,
cifrado em repouso. A verificação fica desenhada para quando houver demanda.
**Contra:** o MVP não tem âncora de identidade forte para o consumidor.

## Decisão

Adotamos **C**.

- `Customer.Cpf` é **nullable** e **nunca pedido no cadastro**. É obrigatório só no primeiro agendamento de
  categoria sensível, cifrado em repouso, nunca em página pública nem em índice de busca.
- A verificação de identidade é a porta `IIdentityVerificationProvider`, no mesmo padrão de
  `IPaymentGateway` e `IGeocodingProvider`, **sem adaptador** no MVP.
- Controles antifraude que entram: aprovação manual como padrão, antecedência mínima, histórico de falta
  por consumidor. Telefone verificado por código é a âncora recomendada, com envio dependente de SMS ou
  WhatsApp pago — porta, sem adaptador.

## Consequências

### O que fica mais fácil

- O sistema não guarda CPF de quem não precisa informá-lo.
- O capítulo de trabalhos futuros descreve a verificação via base oficial, citando o modelo da Uber e o
  custo por consulta.

### O que fica mais difícil

- Limitação declarada: a verificação de identidade de consumidores não é implementada
  (`DOCUMENTO-GERAL.md` §13).
- Quando o fluxo de saúde exigir o CPF, o cifrado em repouso precisa ser implementado de verdade, com
  chave fora do repositório.

### O que passa a ser proibido

- Pedir CPF no cadastro.
- Exibir CPF em página pública ou indexá-lo na busca.
- Guardar CPF em texto puro.

## Premissa não verificada

**A aprovação manual basta contra conta falsa no MVP.** Inferência a partir do fluxo: um pedido só ocupa a
agenda de fato depois que o estabelecimento aprova. Não há dado de uso real. Se a demonstração mostrar
bloqueio de agenda por pedidos pendentes em massa, a premissa falhou — o pedido pendente também ocupa o
horário (ADR-005).

## Como saber que erramos

- Se a vertical de saúde precisar identificar o paciente antes do primeiro agendamento.
- Se surgir exigência legal de identificação forte para agendamento em saúde.

## Referências

- `docs/produto/decisoes-localizacao-notificacao-modelo.md` §2.2, §2.3, §2.4
- `backend/src/Core/Booking.Domain/Entity/Module/People/Customer.cs`
- ADR-012 — idade mínima · `DOCUMENTO-GERAL.md` §13 — limitações
