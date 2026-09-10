# ADR-006 — Slot é resultado de cálculo, não linha de tabela

- **Status:** Aceito
- **Data:** 2026-09-09
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Availability, Scheduling, Discovery
- **Substitui:** modelo esboçado pelo Gemini, em que slot era dado persistido
- **Substituído por:** —

---

## Contexto

"Slot" é um horário oferecido ao consumidor: início, fim, profissional, disponível ou não.
É a coisa que a tela mostra e que o produto vende.

A tentação de guardá-lo em tabela é forte — e os dois protótipos anteriores caíram nela,
com slots *hardcoded*, porque nenhum tinha modelo de disponibilidade.

**A disponibilidade de um profissional é o resultado de cinco fontes combinadas:**

1. `WorkSchedule` — jornada semanal recorrente, com múltiplas linhas por dia
   (a pausa de almoço é a **ausência** de linha entre 12h e 13h, não um campo).
2. `ScheduleException` — `DayOff`, `Vacation` e `Block` subtraem; `ExtraShift` **adiciona**.
3. `Holiday` — nacionais calculados (fixos por constante, móveis derivados da Páscoa pelo
   algoritmo de Gauss), com override por empresa.
4. Agendamentos existentes que ocupam slot.
5. Política da empresa — `SlotStepMinutes` por serviço, `MinLeadTimeHours`,
   `BookingHorizonDays`, `OverflowToleranceMinutes`.

E há um multiplicador: o passo é **por serviço**. O mesmo intervalo de agenda produz conjuntos
de slots diferentes para um corte de 30 min e para uma coloração de 120 min.

## Problema

O horário disponível deve ser materializado em tabela ou calculado sob demanda?

## Alternativas consideradas

### A — Tabela de slots pré-gerada

**A favor:** consulta de leitura trivial (`WHERE available = true`). Índice simples. Fácil de
paginar e de ordenar.

**Contra, e é decisivo:**

- **Volume.** 30 empresas × 4 profissionais × 60 dias × jornada de 8h em passos de 15 min
  são ~230 mil linhas — e isso para **um** passo. Como o passo é por serviço, o produto
  cartesiano cresce com o catálogo. A maioria dessas linhas nunca é lida.
- **Invalidação em cascata.** O `Owner` muda a jornada de terça-feira. Quantas linhas
  invalidar? Todas as terças futuras daquele profissional, para todos os serviços. Marcar
  férias invalida um mês. Cadastrar um serviço com passo novo gera uma safra inteira.
  Cada uma dessas operações vira uma escrita em massa dentro de uma requisição de usuário.
- **Duas fontes de verdade.** A tabela pode divergir dos agendamentos reais, e a divergência
  é silenciosa: a tela mostra livre um horário que já está ocupado.
- **Horizonte.** Alguém precisa gerar slots continuamente para o futuro. É um job que, quando
  falha, faz a agenda simplesmente acabar — sem erro visível.

**Rejeitada.**

### B — Tabela de slots com cache invalidado por evento

**A favor:** mitiga a invalidação manual.

**Contra:** mantém o volume e adiciona uma malha de eventos cuja correção é difícil de provar.
Continua com duas fontes de verdade. **Rejeitada:** mais complexidade para o mesmo defeito de raiz.

### C — Cálculo sob demanda, com `Slot` como objeto de valor efêmero

**A favor:** uma fonte de verdade — as cinco fontes acima. Mudança de jornada tem efeito
imediato, sem invalidar nada. Zero linha morta. Sem horizonte a manter. E o cálculo vira uma
**função pura**, que é o artefato mais testável do sistema.

**Contra:** cada consulta paga o custo do cálculo. A busca por "disponibilidade + serviço"
atravessa várias empresas e é o cenário mais pesado do produto.

## Decisão

Adotamos **C**. `Slot` é objeto de valor efêmero — `start`, `end`, `professionalId`,
`available` — **nunca persistido**.

O `AvailabilityCalculator` é **puro, determinístico e sem I/O**. Recebe jornada, exceções,
feriados, agendamentos e política; devolve lista de `Slot`. Ordem do algoritmo:

```
jornada recorrente do período
  → aplica ExtraShift
  → subtrai DayOff / Vacation / Block
  → subtrai feriados não sobrescritos pela empresa
  → subtrai agendamentos que ocupam slot
  → recorta em passos de SlotStepMinutes
  → descarta onde a ocupação total (buffer + duração + buffer) não cabe,
    tolerando OverflowToleranceMinutes
  → descarta o que viola MinLeadTimeHours e BookingHorizonDays
```

**Contenção de custo,** que é o único ponto fraco da alternativa:

1. **Horizonte limitado.** Cálculo só dentro de `BookingHorizonDays` (padrão 60), com janela
   máxima de **7 dias** por consulta de busca.
2. **Ordem obrigatória na busca** (`SlotSearch`): filtro **geográfico primeiro** (PostGIS
   reduz o conjunto) → filtro textual → cálculo de slots **só nos candidatos restantes** →
   paginação. Calcular antes de filtrar é o erro que torna esta decisão insustentável.
3. **Meta declarada:** RNF-02, p95 ≤ 200 ms para o cálculo; RNF-01, p95 ≤ 800 ms para a busca
   com slots sobre 30 empresas semeadas.
4. **Cache só se a medição exigir.** Não entra no MVP. Se entrar, é cache de resultado com
   chave por profissional + dia + serviço, e não volta a ser tabela de slots.

**Ser função pura é o que dá valor acadêmico.** Todos os casos difíceis — pausa de almoço,
`ExtraShift` em cima de folga, feriado com a empresa aberta, buffer que não cabe no fim do
expediente, virada de horário de verão — viram teste de unidade sem banco, rápido e
determinístico. É a maior bateria de testes do TCC.

## Consequências

### O que fica mais fácil

- Uma fonte de verdade. A tela nunca mostra livre o que já está ocupado.
- Mudança de jornada, folga e feriado têm efeito imediato, sem job nem invalidação.
- O núcleo do domínio é testável sem infraestrutura.
- Zero linha morta no banco.

### O que fica mais difícil

- **Performance passa a ser responsabilidade permanente.** Cada tela de horários paga o cálculo.
  Os RNFs 01 e 02 existem para isso, e precisam ser medidos, não presumidos.
- Não dá para indexar disponibilidade. "Quem tem vaga amanhã de manhã" exige calcular os
  candidatos — daí a ordem obrigatória de filtros.
- O `AvailabilityCalculator` concentra quase toda a complexidade do domínio. É o arquivo mais
  difícil do sistema e vai exigir a maior cobertura de testes.

### O que passa a ser proibido

- Criar tabela de slot, mesmo "só para cache".
- Calcular slots antes de aplicar os filtros geográfico e textual.
- Colocar I/O dentro do `AvailabilityCalculator` — os dados entram por parâmetro.
- Estender o horizonte além de `BookingHorizonDays` sem revisar este ADR.

## Como saber que erramos

- Se o RNF-02 (p95 ≤ 200 ms) não for atingido com 30 empresas semeadas, mesmo com a ordem
  correta de filtros, a premissa de custo caiu e o cache deixa de ser opcional.
- Se o cache virar necessário e ainda assim não bastar, aí sim a materialização volta à mesa —
  e este ADR é substituído, não emendado.
- Se a busca por disponibilidade for a primeira coisa a cortar por lentidão (é a candidata
  declarada a corte no `PROJECT-CONTEXT` §5), a decisão custou uma funcionalidade.

## Referências

- `docs/produto/modelo-de-dominio.md` §2 (objeto de valor `Slot`), §7 (Availability), §9
  (`AvailabilityCalculator`, `SlotSearch`), §13 (divergências em relação ao modelo do Gemini)
- `PROJECT-CONTEXT.md` §4 decisão 16 · §5 busca · §9 RNF-01 e RNF-02
- ADR-005 — a garantia de não-sobreposição é do banco, não do cálculo
