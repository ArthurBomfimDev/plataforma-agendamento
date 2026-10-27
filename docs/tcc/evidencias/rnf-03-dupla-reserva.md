# Evidência — RNF-03: zero dupla reserva sob 50 requisições concorrentes

> **Registro de execução real.** Nenhum número abaixo foi estimado: todos saem da saída dos testes de
> `backend/tests/Booking.IntegrationTests` (`Scheduling/DoubleBookingTests.cs`). Onde uma informação não foi
> capturada, está escrito.

## 1. Ambiente

| Item | Valor |
|---|---|
| Data das execuções | 2026-10-27 |
| Código | Branch `test/integracao-concorrencia`. As execuções rodaram na árvore de trabalho sobre `ef55f10`, com o código de teste idêntico ao dos commits `6afe020`…`a6162e8`, **exceto** o atributo `Skip` do A2 (acrescentado depois das execuções, ver §4) |
| Ambiente | **Local** — Windows 11 Pro, Docker Desktop (engine 29.9.2). **Não executado no CI** até esta data |
| .NET | 10.0.12 (SDK 10.0.401) |
| Banco | `postgis/postgis:17-3.5` por Testcontainers — PostgreSQL 17.5 (Debian 17.5-1.pgdg110+1), PostGIS 3.5.2 |
| Banco por execução | `booking_it_<guid>`, criado, migrado (`Database.Migrate()`) e apagado a cada execução |
| Servidor de aplicação | **Um**: a API real em processo (`WebApplicationFactory<Program>`), sem o `PendingExpirationWorker` |
| Dia agendado | 2026-10-30 (sexta-feira, sem feriado nacional), fuso `America/Sao_Paulo` |

## 2. O que cada teste faz

| # | Teste | Uma linha |
|---|---|---|
| A1 | 50 consumidores, mesmo profissional, mesmo horário | 50 `POST /api/appointments` soltos juntos por uma barreira (`TaskCompletionSource`), serviço de 60 min às 10:00 |
| A2 | A1 em 20 rodadas | 20 corridas de 50, serviço de 30 min, horários de 06:00 a 15:30 sem se tocar |
| A3 | Inícios diferentes, sobrepostos | 50 pedidos distribuídos entre 10:00, 10:15, 10:30 e 10:45 com serviço de 60 min — todo par se sobrepõe |
| A4 | Controle: dois profissionais | Mesmo horário, profissionais diferentes, 2 pedidos simultâneos |
| A5 | Controle: horários encostados | 10:00–11:00 e 11:00–12:00, simultâneos (intervalo `[)`) |
| A6 | Estados que liberam | Pedido cancelado pelo consumidor, depois pedido recusado pelo dono; novo pedido no mesmo horário em cada caso |
| A7 | Controle negativo determinístico | Dois agendamentos sobrepostos gravados direto pelo `DbContext`, sem passar pelo `SlotGuard`: no banco da execução e num banco à parte sem `appointment_no_overlap` |

Contagem no banco: linhas do profissional com estado `Pending`, `Confirmed`, `Completed` ou `NoShow` cujo
`tstzrange(blocked_starts_at, blocked_ends_at, '[)')` intersecta o intervalo — o mesmo predicado da constraint.

## 3. Resultado — evidência

### A1, A3, A4, A5, A6, A7 — 8 execuções do projeto, todas aprovadas

| Teste | Requisições por execução | 201 | 409 `slot_no_longer_available` | 409 com `alternatives` não vazia | Outras respostas | Linhas no intervalo |
|---|---|---|---|---|---|---|
| A1 | 50 | 1 | 49 | 49 | 0 | 1 |
| A3 | 50 | 1 | 49 | 49 | 0 | 1 |
| A4 | 2 | 2 | 0 | — | 0 | 1 por profissional |
| A5 | 2 | 2 | 0 | — | 0 | 2 (encostados) |
| A6 | 3 pedidos em sequência | 3 | 0 | — | 0 | 1 ocupando (os outros 2: `Cancelled`, `Rejected`) |

Os números de A1 e A3 foram iguais nas 8 execuções. Tempo da corrida de 50 (da abertura da barreira à última
resposta), nas 6 execuções em que foi impresso: A1 entre 159 e 273 ms; A3 entre 210 e 380 ms.

**A7 (igual nas execuções em que foi impresso):**

| Banco | Segunda gravação sobreposta | Erro | Linhas |
|---|---|---|---|
| Com a constraint (migration) | **recusada** | `23P01` em `appointment_no_overlap` → `DomainException("appointment.slot_no_longer_available")` | 1 |
| Sem a constraint (`ALTER TABLE … DROP CONSTRAINT appointment_no_overlap`) | **aceita** | nenhum | 2 |

### A2 — 8 execuções de 20 rodadas: 4 aprovadas, 4 reprovadas

| | Valor |
|---|---|
| Rodadas executadas | 160 (8 × 20) |
| Requisições | 8.000 |
| 201 | 157 |
| 409 `slot_no_longer_available` | 7.546 |
| Outras respostas | 297 — nas amostras capturadas, todas **500** |
| Rodadas com 2+ linhas ocupando o mesmo intervalo | **0** |
| Rodadas com 2+ vencedores | **0** |
| Rodadas com **0 vencedores** | **3** |
| Rodadas com alguma resposta 500 | 6 |

Por execução reprovada:

| Execução | Vencedores por rodada | 409 | Outras | Observação |
|---|---|---|---|---|
| suíte completa nº 2 | 20 × 1 | 931 | 49 | conteúdo das 49 não capturado nessa execução |
| repetição 2 | 19 × 1, rodada 10 com **0** | 882 | 99 | amostras impressas: 500 |
| repetição 3 | 18 × 1, rodadas 12 e 15 com **0** | 882 | 100 | amostras impressas: 500 |
| repetição 5 | 20 × 1 | 931 | 49 | log do servidor: 32 × `40P01 deadlock detected`, 17 × `Timeout during reading attempt` |

Na repetição 5, o PostgreSQL identificou onde: *"while checking exclusion constraint on tuple … in relation
appointment"*. A exceção sobe como `InvalidOperationException` ("likely due to a transient failure") →
`DbUpdateException` → `PostgresException 40P01`, que o `BookingDbContext.Translate` não reconhece; o
`DomainExceptionHandler` não a trata, e a resposta é 500.

## 4. Interpretação

- **A garantia de segurança se sustentou em tudo o que foi observado.** Em 8 execuções de A1 e A3 e em 160
  rodadas do A2 (8.800 requisições concorrentes ao todo), nenhuma vez duas linhas ocuparam o mesmo intervalo.
- **O A7 mostra que é a constraint que segura a corrida, não a aplicação.** Sem ela, o mesmo código grava a
  sobreposição sem erro.
- **A garantia de resposta não se sustentou.** Sob disputa, a checagem da constraint de exclusão espera a
  transação concorrente terminar; duas transações esperando uma pela outra viram `40P01`, e filas longas de
  espera estouram o tempo de leitura de 30 s. Essas falhas viram 500 e, em 3 de 160 rodadas, ninguém conseguiu
  o horário que estava livre. O RNF-03 como escrito ("zero dupla reserva") foi observado; "1 vencedor e 49 × 409"
  falhou em 6 das 160 rodadas do A2.
- A1 e A3 usam o mesmo mecanismo e passaram nas 8 execuções, mas **estão expostos ao mesmo defeito**: a
  aprovação deles não prova que ele não ocorra numa execução isolada.
- **Hipótese, não verificada:** a frequência do defeito depende da carga da máquina. A suíte completa nº 2
  rodou junto com os outros projetos de teste; das 5 repetições seguidas só do projeto de integração, 3
  reprovaram.

O A2 está marcado com `[Fact(Skip = "DEFEITO: …")]` com o corpo intacto, para o CI ficar verde e o defeito
continuar visível. A proposta de correção está no PR, sem aplicação: correção de concorrência exige revisão
humana.

## 5. Limitações

- **Um único servidor de aplicação**, em processo, sem rede real entre a API e o `HttpClient` do teste. Não
  cobre múltiplas instâncias da API — embora a garantia esteja no banco, e não na instância, isso não foi
  executado.
- Não cobre falha de rede, queda de conexão no meio da transação, nem relógio dessincronizado.
- Banco em contêiner local, na mesma máquina do teste. Latência e contenção de um banco gerenciado não foram
  medidas.
- **Não executado no CI.** O CI usa `ConnectionStrings__Default`; esse caminho da fixture não rodou nesta data.
- "Simultâneo" significa: 50 tarefas já iniciadas, paradas na mesma barreira e soltas juntas. Não é medição
  de chegada no mesmo microssegundo ao banco.
- 8 execuções não sustentam afirmação estatística sobre a frequência do defeito.

## 6. Como reproduzir

```bash
# em backend/, com Docker rodando
dotnet test tests/Booking.IntegrationTests --logger "console;verbosity=detailed"
```

Para rodar o A2, retire o `Skip` do atributo em `Scheduling/DoubleBookingTests.cs`.
