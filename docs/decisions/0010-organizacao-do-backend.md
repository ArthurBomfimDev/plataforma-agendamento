# ADR-010 — Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI

- **Status:** Aceito
- **Data:** 2026-09-16
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** todos os do backend
- **Substitui:** —
- **Substituído por:** —
- **Detalha:** ADR-007

---

## Contexto

A ADR-007 decidiu por um monólito modular com fronteira verificada pelo build. Faltava decidir a
organização física e as convenções internas — e é nelas que um monólito modular costuma se degradar
sem que ninguém perceba.

**Fatos considerados:**

- O backend é escrito por uma pessoa, em ~9 semanas, com o texto do TCC na mesma janela.
- Os repositórios públicos do desenvolvedor do backend mostram duas organizações consolidadas:
  - `LocalUp` e `MarketplaceBarber` (.NET 10): pastas `src/Core`, `src/Infrastructure`, `src/Presentation`.
  - `ShopControl` (125 arquivos .cs) e `PetShopScheduling` (115): projeto `Arguments` para request e
    response, abstrações genéricas em `Base/`, pasta `Module/<Entidade>` em todas as camadas,
    `Notification`, `UnitOfWork` e Controllers.
- A abstração genérica de `ShopControl` (`IBaseService`) expõe `Update`, `UpdateMultiple`, `Delete` e
  `GetAll()` sem paginação, com identificador `long`.
- `ShopControl` usa AutoMapper 13.0.1.
- O modelo de domínio (`docs/produto/modelo-de-dominio.md`) define agregados com comportamento e
  invariantes: máquina de estados do `Appointment`, snapshot de preço, duração e nome, `Guid` v7.

**Conflito central:** a organização em que o backend é fluente e o modelo de domínio aprovado discordam
em cinco pontos — fronteira entre módulos, CRUD genérico em agregado com estado, tipo de identificador,
paginação e número de representações do mesmo objeto.

## Problema

Como adotar a organização em que o backend já é produtivo sem herdar os cinco pontos em que ela
contradiz decisões já aprovadas — e como impedir que esses pontos voltem com o tempo?

## Decisão

Adotamos a organização de pastas de `LocalUp`/`MarketplaceBarber` com as convenções internas de
`ShopControl`/`PetShopScheduling`, corrigidas pelas sete regras abaixo. **Cada regra é verificada por
`Booking.ArchitectureTests`, que é check obrigatório na `main`.**

```
backend/src/
  Core/            Booking.Domain · Booking.Application · Booking.Arguments
  Infrastructure/  Booking.Infrastructure
  Presentation/    Booking.Api
```

Cada camada tem `Base/` e `Module/<Contexto>/`. O namespace segue sempre
`Booking.<Camada>.Module.<Contexto>` — é o segmento que os testes verificam. A superfície pública de um
módulo fica fora de `Module`, em `Booking.Application.Contracts.<Contexto>`.

### 1. Fronteira de módulo por teste de arquitetura, não por projeto físico

**Regra.** `Booking.*.Module.X` não depende de `Booking.*.Module.Y`. Controller, Command e Query de um
módulo não chamam outro módulo direto — só por `Contracts` ou evento de domínio.

**Motivo.** Um projeto por módulo, com projeto de contratos separado, somaria 22 projetos. Não se
justifica para duas pessoas em dez semanas.

**Alternativa rejeitada.** Fronteira por projeto físico (ADR-007, alternativa E).

**Verificação.** `ModuleBoundaryTests`.

### 2. `Base/` restrito a cadastro sem regra de estado

**Regra.** Abstrações genéricas de `Base/` só podem ser usadas com `Category`, `Service` e `WorkSchedule`.
`Appointment`, `Review`, `AppointmentEvent`, `ConsentRecord` e `SensitiveAccessLog` usam `Commands/` e
`Queries/` com operações nomeadas.

**Motivo.** `Update` genérico deixaria pular a máquina de estados do `Appointment`
(`Pending → Confirmed | Rejected | Expired | Cancelled`). `Delete` genérico apagaria o histórico que o
snapshot existe para preservar.

**Por que lista permitida, e não proibida.** Entidade nova começa fora do `Base` e só entra por decisão
explícita. Uma lista proibida deixaria passar o próximo agregado com estado que ninguém lembrou de incluir.

**Verificação.** `BaseUsageTests`.

### 3. `Guid` v7 em todas as entidades

**Regra.** `BaseEntity.Id` é `Guid` gerado por `Guid.CreateVersion7()`. Toda propriedade `Id` ou `…Id`
no domínio é `Guid`.

**Motivo.** A multi-tenancy por coluna (ADR-003) exige busca entre todas as empresas no mesmo endpoint
público. Identificador sequencial permite enumerar dado de outro tenant. A versão 7 é ordenável no tempo,
o que preserva a eficiência do índice.

**Alternativa rejeitada.** `long` sequencial, como em `ShopControl`.

**Verificação.** `IdentifierTests`, incluindo um teste de comportamento que confirma a versão 7.

### 4. Paginação obrigatória

**Regra.** Método em `Base/`, em `Queries/` ou em tipo `*QueryService` não devolve coleção fora de
`PagedResult<T>`.

**Motivo.** O RNF-01 (busca com slots, p95 ≤ 800 ms com 30 empresas semeadas) não se sustenta com
listagem sem limite.

**Alternativa rejeitada.** `GetAll()` sem paginação, como em `ShopControl`.

**Verificação.** `PaginationTests`.

### 5. Sem entidade de persistência separada

**Regra.** O EF Core mapeia a entidade de domínio direto, via Fluent API em `Mapping/`, com backing
fields para os setters privados. `IEntityTypeConfiguration<T>` e `DbSet<T>` só de tipo do domínio.

**Motivo.** Elimina a quarta forma do mesmo objeto (Domain, DTO, Arguments e Persistence), reduzindo a
superfície onde um bug de mapeamento reescreveria o snapshot de preço, duração e nome do `Appointment`.

**Alternativa rejeitada.** Entidade de persistência separada em `Persistence/Entity`, como em `ShopControl`.

**Verificação.** `PersistenceMappingTests`.

### 6. `Converter/` manual obrigatório onde há snapshot ou máquina de estado

**Regra.** Nos módulos `Scheduling`, `Reputation` e `Compliance`, nenhuma dependência de mapeador por
reflexão (`AutoMapper`, `Mapster`); a conversão é manual, em `Converter/`. Os pacotes `AutoMapper` e
`MediatR` não podem ser declarados em nenhum projeto.

**Motivo.** Mapeamento automático por reflexão é o lugar mais provável de recalcular o preço atual em
vez de preservar o valor congelado — um bug silencioso, que não aparece em teste. **O motivo é
correção, não custo de licença.**

**Alternativas avaliadas:**

| Opção | Situação verificada | Decisão |
|---|---|---|
| AutoMapper | MIT até a 14.0.0; da 15 em diante, licença dupla RPL-1.5 ou comercial. Licença comunitária gratuita para uso educacional e empresas com receita bruta anual abaixo de US$ 5 milhões. Preço comercial por faixa de tamanho de equipe | Não usar — motivo de correção |
| AutoMapperMIT (fork de Shane32) | MIT, baseado na 14.x. **O próprio README declara que não terá manutenção de longo prazo**: só correções de vulnerabilidade grave e migração de framework | Permitido apenas em DTO de cadastro simples, se houver necessidade |
| MediatR | Apache-2.0 até antes da 13.0; da 13.0 em diante, licença dupla RPL-1.5 ou comercial | Não usar agora — `Commands/`+`Queries/` como services simples bastam; `UnitOfWork` cobre transação e `Notification` cobre validação |
| Mediator (martinothamar) | MIT, gerado por source generator, sem relação com a Lucky Penny Software | Alternativa preferida, se a equipe decidir usar mediator |

**Verificação.** `ForbiddenDependencyTests` — varredura de pacotes e regra de namespace nos módulos com estado.

### 7. Outbox como fila de evento

**Regra.** O evento é gravado no Outbox na mesma transação da escrita. Nenhum barramento de mensagens:
`MassTransit`, `RabbitMQ.Client`, `Confluent.Kafka`, `Azure.Messaging.ServiceBus` e `NServiceBus` não
podem ser declarados.

**Motivo.** Cobre o lado de evento sem barramento novo, já decidido para notificações.

**Verificação.** `ForbiddenDependencyTests`, para os pacotes. **A garantia transacional em si ainda não é
verificada** — entra como teste de integração quando o Outbox existir.

### Como as regras são verificadas

Cada regra tem dois testes:

1. **Contra a produção** — falha se o código real violar a regra.
2. **Contra `Booking.ArchitectureTests.Fixtures`** — um projeto com violações plantadas de propósito. O
   teste exige que a regra **acuse** a violação e **não acuse** o contraexemplo correto.

Sem a segunda metade, uma regra quebrada passaria verde para sempre no teste de produção.

## Consequências

### O que fica mais fácil

- O backend começa na organização em que já é produtivo.
- As sete regras são verificadas a cada PR; não dependem de lembrança nem de revisão atenta.
- Uma violação reprova o CI com o tipo e a dependência exatos na mensagem.
- Sem mapeador por reflexão nos módulos com estado, o snapshot só muda onde está escrito para mudar.

### O que fica mais difícil

- **O compilador não protege a fronteira entre módulos** — ver ADR-007.
- Conversão manual é mais código para escrever nos módulos com estado.
- Agregado com estado não aproveita o CRUD genérico: cada operação é escrita explicitamente.
- Mudar uma decisão exige mudar a ADR **e** `ArchitectureConventions.cs` no mesmo PR.

### O que passa a ser proibido

- Qualquer uma das sete violações acima.
- Regra de arquitetura nova sem o par de teste contra a fixture.
- Remover `Booking.ArchitectureTests.Fixtures` ou "corrigir" as violações plantadas nele.

## Premissa não verificada

**Premissa 1 — decisão 1.** Vinte e dois projetos custariam mais do que o risco aceito de proteger a
fronteira só por teste. **Inferência**, não medição. Se violações passarem a escapar do teste, a
alternativa por projeto físico volta à mesa por nova ADR.

**Premissa 2 — decisão 6.** Mapeamento por reflexão é "o lugar mais provável" de recalcular o preço
congelado. **Inferência** baseada no mecanismo — o mapeador copia o valor de onde a configuração
mandar, sem distinguir valor atual de valor congelado. Não há incidente medido neste projeto. Se a
conversão manual passar a gerar mais bug do que evita, a premissa foi contradita.

**Premissa 3 — decisão 4.** Sem paginação, o RNF-01 não se sustenta. **Hipótese a verificar** pela medição
com k6 prevista no próprio RNF-01. Se a meta for atingida por outro meio, a regra continua valendo por
outro motivo: listagem sem limite é risco de disponibilidade, não só de desempenho.

## Como saber que erramos

- Se exceções às regras começarem a ser pedidas com frequência, alguma regra está no lugar errado.
- Se `Business` (Tenancy) começar a ter bug de transição de estado: ele tem máquina de estados
  (`Draft → PendingReview → Active → Suspended`) e **não está coberto pelas decisões 2 e 6**. A decisão 2
  o exclui do `Base` pela lista permitida; a decisão 6 não o protege de mapeador por reflexão.
- Se o Outbox for implementado e a garantia transacional não ganhar teste de integração, a decisão 7
  virou declaração em vez de fato.

## Referências

- ADR-003 — multi-tenancy por coluna · ADR-007 — monólito modular
- `docs/produto/modelo-de-dominio.md` §2, §3, §8
- `PROJECT-CONTEXT.md` §9 — RNF-01
- `backend/tests/Booking.ArchitectureTests/` e `backend/tests/Booking.ArchitectureTests.Fixtures/`
- PR #2 — prova da regra de fronteira com violação em código de produção
- [AutoMapper and MediatR Commercial Editions Launch Today — Jimmy Bogard](https://www.jimmybogard.com/automapper-and-mediatr-commercial-editions-launch-today/)
- [Licensing FAQ — Lucky Penny Software](https://luckypennysoftware.com/faq)
- [Shane32/AutoMapperMIT — GitHub](https://github.com/Shane32/AutoMapperMIT)
- [martinothamar/Mediator — GitHub](https://github.com/martinothamar/Mediator)
- [NetArchTest.eNhancedEdition — GitHub](https://github.com/NeVeSpl/NetArchTest.eNhancedEdition)
- Repositórios públicos `ArthurBomfimDev/LocalUp`, `MarketplaceBarber`, `ShopControl`, `PetShopScheduling` — consultados em 2026-09-16
- Consultas de licença e preço realizadas em 2026-09-16
