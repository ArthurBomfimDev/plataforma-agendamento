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

O A2 ficou marcado com `[Fact(Skip = "DEFEITO: …")]` com o corpo intacto, para o CI ficar verde e o defeito
continuar visível — até a correção da §6, que o reativou. A proposta de correção está no PR, sem aplicação: correção de concorrência exige revisão
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

## 6. Depois da correção (27/10)

Os dois defeitos da §3 e §4 foram corrigidos na branch `fix/concorrencia-reserva`
(PR da Onda 1). As seções 1 a 5 ficam como estavam: são o registro de antes.

### 6.1 O que mudou

| Defeito | Correção | Commit |
|---|---|---|
| P — mesma `IdempotencyKey` simultânea → 400 | O comando desanexa a entidade recusada e devolve o agendamento já gravado com a mesma chave | `1535428` |
| O — `40P01` e timeout sob disputa → 500 | `pg_advisory_xact_lock` por profissional, na mesma transação do INSERT, antes dele (ADR-019). A constraint continua sendo quem recusa | `b89c143` |
| Defesa | `40P01`/`55P03`, se aparecerem, viram `appointment.contention_try_again` (503), nunca 500 | `9893245` |

### 6.2 Ambiente das medições

Mesmo do §1: 2026-10-27, local, Windows 11 Pro, Docker Desktop 29.9.2, .NET 10.0.12, `postgis/postgis:17-3.5`
(PostgreSQL 17.5, PostGIS 3.5.2) por Testcontainers, um servidor de aplicação, dia agendado 2026-10-30.

| Medição | Código que rodou |
|---|---|
| **Antes** (5 execuções seguidas) | `1535428` (idempotência já corrigida, **sem** o lock), com A2 e C2 reativados e o A2 imprimindo o tempo de cada rodada |
| **Depois** (20 execuções seguidas) | `b89c143` (com o lock, sem a tradução de defesa), com os mesmos testes |
| Defesa e caminho do CI (1 execução) | `3f10af4` (tudo, incluindo A8) |

### 6.3 Resultado — evidência

**Antes do lock — 5 execuções:**

| | Valor |
|---|---|
| Execuções aprovadas | **0 de 5** (A2 reprovou em todas; os outros 18 casos aprovaram) |
| Rodadas do A2 com 0 vencedores | 3 de 100 |
| Rodadas presas (cerca de 30 s) | 1 por execução — 30.145 a 30.169 ms |
| Exceções não tratadas no log do servidor | 248 (168 × `40P01 deadlock detected`, 80 × `Timeout during reading attempt`) |
| C2 | 201 × 20, 1 linha, nas 5 (o defeito P já estava corrigido) |

**Depois do lock — 20 execuções seguidas:**

| | Valor |
|---|---|
| Execuções aprovadas | **20 de 20** (19 de 19 casos em cada) |
| A1 e A3 | 1 × 201 e 49 × 409 com `alternatives` em todas |
| A2 | 20 vencedores, 20 linhas e 980 × 409 em todas; 0 respostas inesperadas |
| C2 | 201 × 20, 1 `Id`, 1 linha em todas |
| Rodadas com 0 vencedores | 0 de 400 |
| `40P01`, `55P03`, timeout de leitura, exceção não tratada no log | **0** |
| Tempo de cada execução do projeto | 25,1 a 28,3 s |

**Latência — tempo da corrida de 50, da abertura da barreira à última resposta (ms):**

| Cenário | Antes (sem lock) | Depois (com lock) |
|---|---|---|
| A1 — mesmo horário | 5 execuções: mín 158 · mediana 185 · máx 210 | 20 execuções: mín 461 · p50 480 · p95 523 · máx 552 |
| A3 — inícios sobrepostos | 5 execuções: mín 188 · mediana 197 · máx 206 | 20 execuções: mín 265 · p50 315 · p95 375 · máx 377 |
| A2 — cada rodada | 100 rodadas: p50 174 · p95 224 · máx **30.169** (5 rodadas presas); sem as presas, máx 224 | 400 rodadas: mín 401 · p50 482 · p95 545 · máx 1.227 |

**Defesa (A8) e caminho do CI — `3f10af4`:**

- A8: com uma transação segurando o lock do profissional e outra com `lock_timeout = '200ms'`, a segunda recebeu
  `appointment.contention_try_again`; outro profissional gravou sem esperar. Com a tradução desligada de propósito,
  o mesmo teste reprovou com `PostgresException` cru — a defesa já falhou uma vez, como a regra do projeto exige.
- Caminho do CI (`ConnectionStrings__Default` apontando para um `postgis/postgis:17-3.5` avulso, sem
  Testcontainers): `Booking.IntegrationTests` 20 de 20, `Booking.ArchitectureTests` 28 de 28,
  `Booking.UnitTests` 81 de 81. Nenhum `booking_it_*` sobrou no servidor depois da execução.
- No GitHub Actions, o CI do PR #13 (antes da correção, com A2 e C2 pulados) aprovou 17 de 17 casos de
  integração pelo serviço PostgreSQL do runner.

### 6.4 Interpretação

- **O lock eliminou o defeito nas condições medidas.** De 5 de 5 execuções reprovadas para 20 de 20
  aprovadas, e de 248 exceções não tratadas para zero.
- **O lock custa latência, e o custo é a fila.** A corrida de 50 pelo mesmo horário passou de cerca de
  180 ms para cerca de 480 ms na mediana. É o tempo de 50 transações passarem uma a uma pelo INSERT do
  mesmo profissional. Em troca, a pior rodada caiu de 30 s (timeout) para 1,2 s.
- **A garantia contra dupla reserva não mudou de lugar.** Continua na constraint; o A7 continua provando
  isso. O lock não verifica sobreposição.
- A tradução de `40P01`/`55P03` ficou como **defesa**: não apareceu nenhum dos dois depois do lock, e o A8
  só a exercita forçando `lock_timeout`.

### 6.5 Limitações que continuam

- **Uma instância da API.** O lock é do banco, então por mecanismo vale para várias instâncias. Isso é
  inferência: não foi executado com mais de uma.
- 50 concorrentes pelo mesmo profissional. Com picos muito maiores, a fila cresce linearmente e o pool de
  conexões passa a ser o limite — não medido.
- Banco em contêiner local, na mesma máquina do teste; latência de rede de um banco gerenciado não medida.
- 20 execuções não sustentam afirmação estatística sobre a ausência do defeito; sustentam que ele não
  apareceu em 20 execuções seguidas, depois de aparecer em 5 de 5 antes.
- No GitHub Actions, o CI do PR #14 (commit `31cee96`, com a correção) aprovou `Booking.IntegrationTests` 20 de 20, `Booking.ArchitectureTests` 28 de 28 e `Booking.UnitTests` 81 de 81, pelo serviço PostgreSQL do runner. Uma execução: não repete a medição de 20 vezes.

### 6.6 Janela que a correção P deixou aberta (encontrada em 27/10, na Onda 2)

**Evidência.** Numa execução da suíte inteira da Onda 2, o C2 reprovou com 409 × 19 e 201 × 1, depois de
ter aprovado nas 20 execuções da §6.3. O comando confere a chave, depois a disponibilidade (`SlotGuard`) e
só então grava; a correção de `1535428` tratou só a recusa na gravação. Se a requisição vencedora grava
entre a conferência da chave e o `SlotGuard`, as outras eram recusadas ali.

**Correção** (`8761048`): o `SlotGuard` recusando, o comando procura a mesma chave antes de responder 409.
Depois dela, `Booking.IntegrationTests` (39 casos) aprovou em 10 de 10 execuções seguidas, com o C2 em
201 × 20 e 1 linha em todas.

**Interpretação.** A janela depende da ordem de chegada das requisições e não é provocável de forma
determinística sem mudar o código de produção; 20 execuções aprovadas não a revelaram. A prova da
correção é repetição, com o mesmo limite estatístico da §6.5.

## 7. Como reproduzir

```bash
# em backend/, com Docker rodando
dotnet test tests/Booking.IntegrationTests --logger "console;verbosity=detailed"
```

Desde `3f10af4` o A2 e o C2 rodam sem `Skip`. Para reproduzir o "antes", rode a partir de `1535428` (sem o
lock) e retire o `Skip` do A2.
