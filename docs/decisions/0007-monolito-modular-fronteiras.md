# ADR-007 — Monólito modular com fronteiras verificadas pelo build

- **Status:** Aceito
- **Data:** 2026-09-09
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** todos
- **Substitui:** README de repositório anterior, que definia microsserviços com RabbitMQ, Redis e YARP
- **Substituído por:** —

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

E um fato do domínio que pesa mais que todos: **a regra mais importante do sistema é uma
invariante transacional.** Um agendamento não pode se sobrepor a outro (ADR-005). Num processo
com um banco, isso é uma constraint. Espalhado entre `Scheduling` e `Tenancy` como serviços
separados, vira saga distribuída com compensação — o problema mais difícil de sistemas
distribuídos, resolvido por dois estudantes, sem necessidade nenhuma.

## Problema

Como obter fronteiras arquiteturais claras — que sustentem o argumento acadêmico e permitam
evolução — sem pagar o custo operacional de um sistema distribuído?

## Alternativas consideradas

### A — Microsserviços

**A favor:** deploy independente, isolamento de falha, escala por serviço. Aparência de
maturidade arquitetural num TCC.

**Contra:** nenhum dos critérios que justificam microsserviços existe aqui — não há equipes que
se atrapalham, não há necessidade de deploy independente, não há cargas diferentes, não há
requisito de isolamento de falha. E a invariante central viraria saga distribuída.
Um diagrama de microsserviços não implementados vale menos, academicamente, do que uma
fronteira implementada e verificada. **Rejeitada.**

### B — Monólito comum, organizado por camada (Controllers / Services / Repositories)

**A favor:** simples, familiar, rápido de começar.

**Contra:** a organização por camada não cria fronteira nenhuma — qualquer serviço chama
qualquer repositório. Em poucas semanas o acoplamento é total e não há como argumentar sobre
limites de contexto no texto do TCC, porque não existem. **Rejeitada.**

### C — Monólito modular, com fronteiras por convenção

**A favor:** todo o benefício operacional do monólito, com módulos declarados.

**Contra:** fronteira por convenção não sobrevive à pressa. Na semana em que o prazo aperta,
alguém referencia o tipo interno do outro módulo "só dessa vez", e o monólito modular vira
monólito comum sem que ninguém perceba.

### D — Monólito modular com fronteiras **verificadas pelo build**

**A favor:** tudo de C, e a fronteira deixa de depender de disciplina. Um teste de arquitetura
falha a construção quando a regra é quebrada.

**Contra:** exige escrever e manter os testes de arquitetura; eles vão incomodar exatamente
quando o prazo apertar — que é quando eles servem.

## Decisão

Adotamos **D**: um processo, um banco PostgreSQL, oito módulos com fronteira explícita.

`Identity` · `Tenancy` · `People` · `Catalog` · `Availability` · `Scheduling` · `Reputation` ·
`Compliance` — mais `Booking.Api` (host e composição) e `Booking.Shared` (tipos base, contexto
de tenant, `Result`, erros).

**As quatro regras de fronteira:**

1. Um módulo **não** referencia tipo interno de outro. Só a interface pública
   (`ICatalogQueries`, `IAvailabilityQueries`).
2. Escrita entre módulos **só por evento de domínio**, publicado via **Outbox** na mesma
   transação da escrita — `AppointmentConfirmed`, `ReviewSubmitted`, `BusinessActivated`.
3. **Nenhuma chave estrangeira atravessa fronteira de módulo.** A integridade referencial
   entre módulos é responsabilidade do domínio, não do banco.
4. `Booking.ArchitectureTests` **quebra o build** quando 1 ou 3 são violadas.

A regra 4 é o núcleo desta decisão. É ela que transforma "monólito modular" de intenção
declarada em fato verificável — e é o que a torna **evidência** para o TCC: um teste automatizado
que prova a fronteira vale mais, num capítulo de arquitetura, do que qualquer diagrama.

**Sobre o banco:** um banco, um schema, coluna `business_id` (ADR-003). Os módulos são fronteira
de **código**, não de banco. Separar schemas por módulo agora custaria a integridade que a
regra 3 já abre mão dentro do domínio, sem benefício correspondente nesta escala.

**Sobre a extração futura:** as regras 1 e 2 existem para que um módulo *possa* ser extraído se
algum dia houver motivo. Extrair não é objetivo, é opção mantida aberta a custo baixo.

## Consequências

### O que fica mais fácil

- A invariante de não-sobreposição é uma constraint de banco, não uma saga.
- Um deploy, um log, um depurador. Reproduzir bug localmente é `docker compose up`.
- Teste de integração roda contra um banco real, sem orquestrar serviços.
- Custo de hospedagem de uma unidade só.

### O que fica mais difícil

- **Os testes de arquitetura vão travar merges.** É o objetivo, mas vai doer perto do prazo.
- Comunicação entre módulos fica mais cerimoniosa que uma chamada direta — interface pública
  ou evento, nunca o atalho.
- A regra 3 significa que integridade entre módulos não é garantida pelo banco. Órfão vira
  possibilidade real e precisa de tratamento no domínio.
- Um erro não isolado derruba tudo. Aceitável sem SLA; deixaria de ser com um.

### O que passa a ser proibido

- Referenciar tipo interno de outro módulo.
- Chave estrangeira atravessando fronteira de módulo.
- Injetar o `DbContext` de um módulo em outro.
- Extrair serviço separado sem novo ADR que demonstre o problema operacional que ele resolve.

## Como saber que erramos

- Se os testes de arquitetura passarem a ser contornados com exceções frequentes, ou a fronteira
  está no lugar errado ou a regra é rígida demais — em qualquer dos casos, revisar em vez de
  ignorar.
- Se um módulo precisar de escala independente (o cálculo de disponibilidade é o candidato),
  aí existe o motivo operacional que falta hoje.
- Se o tempo de build passar a atrapalhar o ciclo de trabalho, o monólito ficou grande demais
  para o processo atual.

## Referências

- `PROJECT-CONTEXT.md` §4 decisão 4 · §11 contradições resolvidas
- `docs/produto/modelo-de-dominio.md` §1 — os 8 módulos e as 17 entidades; §12 — eventos de domínio
- `CLAUDE.md` §5 — organização por módulo e as quatro regras de fronteira
- ADR-003 (multi-tenancy), ADR-005 (constraint de exclusão)
