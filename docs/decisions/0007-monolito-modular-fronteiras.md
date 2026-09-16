# ADR-007 — Monólito modular com fronteira de módulo verificada pelo build

- **Status:** Aceito
- **Data:** 2026-09-09 · **reescrita antes do merge em 2026-09-16**
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** todos
- **Substitui:** README de repositório anterior, que definia microsserviços com RabbitMQ, Redis e YARP
- **Substituído por:** —
- **Detalhada por:** ADR-010 — organização física do backend e as regras verificadas no CI

> **Por que foi reescrita.** A primeira versão desta ADR previa um projeto por módulo, com fronteira
> garantida pelo compilador. Antes do merge, a equipe avaliou que 22 projetos não se justificam para
> duas pessoas em dez semanas e trocou a fronteira física por fronteira de namespace verificada por
> teste. Como a ADR ainda não estava mergeada, foi reescrita em vez de substituída. A alternativa
> descartada está registrada abaixo como **E**.

---

## Contexto

Um repositório anterior do projeto (hoje apagado) declarava arquitetura de microsserviços com
quatro serviços, gateway YARP, RabbitMQ, Redis, CQRS e Event Sourcing. Tinha um commit e
nenhum código.

**Fatos que decidem a escolha:**

- Dois desenvolvedores, tempo parcial, ~9 semanas.
- Um ambiente, nenhuma versão publicada, tráfego previsto próximo de zero (30 empresas semeadas).
- Orçamento próximo de zero — cada serviço separado é mais uma unidade a hospedar.
- Nenhum dos dois operou sistema distribuído.
- O desenvolvedor do backend tem repertório consolidado em organização por camadas com projetos
  físicos (`Api`, `Arguments`, `Domain`, `Infrastructure`), verificável nos repositórios públicos
  `ShopControl` e `PetShopScheduling`.

E um fato do domínio que pesa mais que todos: **a regra mais importante do sistema é uma
invariante transacional.** Um agendamento não pode se sobrepor a outro (ADR-005). Num processo
com um banco, isso é uma constraint. Espalhado entre `Scheduling` e `Tenancy` como serviços
separados, vira saga distribuída com compensação.

## Problema

Como obter fronteiras entre módulos que se sustentem na prática — e no argumento acadêmico — sem
pagar o custo operacional de um sistema distribuído e sem uma estrutura de projetos maior do que
a equipe consegue manter?

## Alternativas consideradas

### A — Microsserviços

**A favor:** deploy independente, isolamento de falha, escala por serviço.

**Contra:** nenhum dos critérios que justificam microsserviços existe aqui — não há equipes que
se atrapalham, necessidade de deploy independente, cargas diferentes nem requisito de isolamento
de falha. E a invariante central viraria saga distribuída. **Rejeitada.**

### B — Monólito por camada, sem fronteira de módulo

**A favor:** simples, familiar, rápido de começar.

**Contra:** qualquer serviço chama qualquer repositório. Em poucas semanas o acoplamento é total, e
não há como argumentar sobre limites de contexto no TCC porque eles não existem. **Rejeitada.**

### C — Monólito modular com fronteira por convenção

**A favor:** o benefício operacional do monólito, com módulos declarados.

**Contra:** fronteira por convenção não sobrevive à pressa. Na semana em que o prazo aperta, alguém
referencia o tipo interno do outro módulo "só dessa vez". **Rejeitada.**

### D — Monólito modular com fronteira verificada pelo build, por namespace

Camadas como projetos físicos; módulos como namespace `Booking.<Camada>.Module.<Contexto>` dentro
de cada camada; um teste de arquitetura obrigatório no CI que falha quando um módulo depende do
interno de outro.

**A favor:** preserva a organização por camadas em que o backend já é fluente; cinco projetos em
vez de vinte e dois; a fronteira continua sendo verificada automaticamente e bloqueia o merge.

**Contra:** **o compilador aceita a violação** — só o teste a pega. Uma fronteira de namespace é
mais fraca que uma fronteira de assembly, e depende de o teste estar correto e ser obrigatório.

### E — Monólito modular com um projeto por módulo (e projeto `.Contracts` separado)

**A favor:** a fronteira é garantida pelo compilador — sem referência de projeto, não há como usar
o tipo interno de outro módulo.

**Contra:** 8 módulos × 2 projetos, mais host, kernel compartilhado e testes: 22 projetos. Para duas
pessoas em dez semanas, é build mais lento, solução mais ruidosa e cerimônia constante, numa
estrutura em que nenhum dos dois tem experiência. **Rejeitada** — e foi a proposta original desta ADR.

## Decisão

Adotamos **D**.

**Por que D não é B.** B foi rejeitada por não ter fronteira nenhuma. D mantém a organização física
por camadas de B, mas a fronteira entre módulos existe e é verificada — por namespace, não por projeto.
O que muda em relação à proposta original (E) é **onde** a fronteira é garantida, não **se** ela é.

Um processo, um banco PostgreSQL, cinco projetos, oito módulos:

`Identity` · `Tenancy` · `People` · `Catalog` · `Availability` · `Scheduling` · `Reputation` · `Compliance`

**As quatro regras de fronteira:**

1. Código em `Booking.*.Module.X` **não** depende de `Booking.*.Module.Y`. A única superfície de um
   módulo visível aos outros é `Booking.Application.Contracts.Y`. Vale para Controller, Command,
   Query, repositório e mapeamento.
2. Escrita entre módulos **só por evento de domínio**, publicado via **Outbox** na mesma transação
   da escrita — `AppointmentConfirmed`, `ReviewSubmitted`, `BusinessActivated`.
3. **Nenhuma chave estrangeira atravessa fronteira de módulo.** A integridade referencial entre
   módulos é responsabilidade do domínio, não do banco.
4. `Booking.ArchitectureTests` **quebra o build** quando a regra 1 é violada. É check obrigatório
   na proteção da `main`.

**A regra 4 foi provada, não presumida.** No PR do esqueleto, um commit plantou uma violação real em
código de produção: o compilador aceitou (0 erros) e o teste reprovou, apontando o tipo e a dependência.
O teste também roda permanentemente contra um projeto de fixtures com a violação plantada, e exige que
ela seja acusada — uma regra que só roda contra código correto passaria verde mesmo quebrada.

**Sobre o banco:** um banco, um schema, um `DbContext`, coluna `business_id` (ADR-003). Os módulos
são fronteira de **código**, não de banco.

## Consequências

### O que fica mais fácil

- A invariante de não-sobreposição é uma constraint de banco, não uma saga.
- Um deploy, um log, um depurador.
- Teste de integração roda contra um banco real, sem orquestrar serviços.
- A estrutura bate com o repertório de quem escreve o backend.

### O que fica mais difícil

- **O compilador não protege a fronteira.** Se o teste de arquitetura for desligado, ignorado ou
  tornado opcional, a fronteira deixa de existir sem nenhum aviso.
- **O `DbContext` é único.** Uma consulta por SQL cru, escrita dentro de um módulo, consegue ler a
  tabela de outro sem depender de nenhum tipo dele — e o teste de namespace não vê isso.
- Comunicação entre módulos fica mais cerimoniosa que uma chamada direta.
- A regra 3 significa que integridade entre módulos não é garantida pelo banco.

### O que passa a ser proibido

- Depender de `Booking.*.Module.Y` a partir de `Booking.*.Module.X`.
- Chave estrangeira atravessando fronteira de módulo.
- SQL cru que leia tabela de outro módulo.
- Tornar `Booking.ArchitectureTests` opcional no CI.
- Extrair serviço separado sem novo ADR que demonstre o problema operacional que ele resolve.

## Premissa não verificada

**Premissa:** o custo de manter 22 projetos seria maior, para esta equipe e neste prazo, do que o
risco aceito ao trocar a fronteira de compilador por fronteira de teste.

**Natureza:** **inferência** da equipe, baseada em experiência e no prazo. Não foi medido tempo de
build, tempo de desenvolvimento nem frequência de violação em nenhuma das duas estruturas.

**O que muda se for contradita:** se a violação de fronteira passar a escapar do teste com frequência
(por SQL cru, reflexão ou exceção concedida), a proteção por namespace não bastou, e a alternativa E
volta à mesa — por nova ADR que substitua esta.

## Como saber que erramos

- Se `Booking.ArchitectureTests` passar a ser contornado com exceções frequentes, a fronteira está no
  lugar errado ou a regra está rígida demais — revisar em vez de ignorar.
- Se aparecer acesso cruzado a tabela por SQL cru, a limitação conhecida do `DbContext` único virou
  problema real.
- Se um módulo precisar de escala independente (o cálculo de disponibilidade é o candidato), aí existe
  o motivo operacional que falta hoje.

## Referências

- ADR-010 — organização física do backend e as 7 decisões verificadas no CI
- `PROJECT-CONTEXT.md` §4 decisão 4 · §11 contradições resolvidas
- `docs/produto/modelo-de-dominio.md` §1 — os 8 módulos e as 17 entidades; §12 — eventos de domínio
- `CLAUDE.md` §5 — organização do backend
- `backend/tests/Booking.ArchitectureTests/ModuleBoundaryTests.cs`
- PR #2 — prova da violação: commit de violação proposital com CI reprovado, seguido da remoção com CI aprovado
- ADR-003 (multi-tenancy), ADR-005 (constraint de exclusão)
- Repositórios públicos `ArthurBomfimDev/ShopControl` e `ArthurBomfimDev/PetShopScheduling`, consultados em 2026-09-16
