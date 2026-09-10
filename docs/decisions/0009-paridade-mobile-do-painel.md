# ADR-009 — Paridade mobile completa no painel, como decisão de inclusão digital

- **Status:** Aceito
- **Data:** 2026-09-09
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** frontend (painel do estabelecimento), design system
- **Substitui:** decisão registrada em `docs/design/componentes-e-telas.md` de que o painel
  seria apenas desktop
- **Substituído por:** —

---

## Contexto

O produto tem dois lados. O do consumidor sempre foi mobile-first — ninguém discute que se
agenda pelo celular. O do estabelecimento foi desenhado só para desktop de 1280px, seguindo
a convenção de que ferramenta de gestão é ferramenta de computador.

**A convenção não corresponde ao público que este produto atende.**

O MVP mira beleza e bem-estar em uma cidade do interior paulista. Uma parcela relevante dos
prestadores dessa vertical — barbeiro, manicure, esteticista, autônomo que trabalha sozinho —
opera o negócio inteiro pelo celular. Não é preferência: é o único computador que a pessoa tem.

**Nota de honestidade metodológica.** Não medimos isso. A afirmação acima é **inferência**
apoiada em observação informal do mercado, não evidência coletada. Se as entrevistas com
prestadores (2–3, previstas) contradisserem, a justificativa muda — mas a decisão de projeto
provavelmente não, porque o custo de estar errado é assimétrico: fazer painel mobile que
poucos usam custa algumas semanas de layout; não fazer exclui quem não tem alternativa.

E há a consequência que não é sobre gosto: **restringir o painel ao desktop é decidir quem
pode usar o sistema.** Um marketplace que só aceita prestador com computador seleciona
prestador por posse de equipamento. Isso não é detalhe de implementação — é escolha de projeto
com efeito de exclusão, e como tal precisa de decisão consciente e registrada.

## Problema

O painel do estabelecimento deve ter versão mobile completa, ou o desktop basta para o MVP?

## Alternativas consideradas

### A — Painel só desktop, mobile depois se sobrar tempo

**A favor:** economiza o refluxo de ~12 telas densas. A agenda do dia multi-profissional, que
é a tela mais difícil, ficaria como está. Libera semanas num prazo de nove.

**Contra:** "depois se sobrar tempo" nunca sobra. E o custo cai justamente sobre o prestador
com menos recurso. **Rejeitada.**

### B — Painel mobile só para as telas críticas (ver agenda, aceitar pedido)

**A favor:** meio-termo defensável; cobre o uso diário com uma fração do trabalho.

**Contra:** cria um painel de duas classes. O prestador que só tem celular consegue aceitar
pedido mas não consegue **cadastrar serviço, definir jornada nem bloquear período** — ou seja,
não consegue sequer ativar a empresa, já que `Business.Activate()` exige ≥1 serviço,
≥1 profissional e ≥1 jornada. Ele não entra no sistema. **Rejeitada** — resolve o uso e
não resolve a entrada, que é onde a exclusão acontece.

### C — Paridade completa em 390px

**A favor:** o prestador com celular faz tudo o que o prestador com computador faz. A
justificativa vira argumento acadêmico próprio, no capítulo de justificativa. Como o mesmo
build alimenta PWA e Capacitor, o painel mobile também é o caminho do app.

**Contra:** ~12 telas densas para refluir; a agenda multi-profissional exige redesenho real;
todo controle denso precisa subir para alvo de toque de 44px; o PWA sai de "se sobrar tempo"
e entra no escopo.

## Decisão

Adotamos **C**: **todas** as telas do painel terão versão mobile de **390px**.

Consequências obrigatórias, todas já refletidas no `CLAUDE.md` §3.1:

1. **O painel passa a ser mobile-first.** As 6 regras de empacotamento e a safe-area valem
   para ele como valem para a vitrine.
2. **Alvo de toque de 44px em todo controle**, inclusive nos densos hoje desenhados para
   mouse. Sem exceção para tabela e para célula de agenda.
3. **PWA entra no escopo do MVP** — instalação, ícone, splash e offline básico. Deixa de ser
   item de "se sobrar tempo", porque é como o prestador sem computador guarda o sistema no
   celular.
4. **A agenda do dia multi-profissional é redesenhada, não refluída.** Colunas paralelas por
   profissional não cabem em 390px. Padrão adotado: **um profissional por vez**, seletor
   horizontal de profissionais no topo, dia como **lista cronológica** em vez de grade.
5. **Relatórios viram cartões empilhados**, com rolagem horizontal apenas dentro da tabela —
   nunca no corpo da página.

## Consequências

### O que fica mais fácil

- O prestador sem computador consegue ativar a empresa e operar o negócio inteiro.
- Uma linguagem de interface só, mobile-first nos dois lados do produto.
- O caminho para Capacitor fica pronto: o painel já cabe no shell nativo.
- O TCC ganha um argumento de justificativa que não é técnico e não é comum em trabalho de ADS.

### O que fica mais difícil

- **Custa semanas de trabalho de frontend**, com uma pessoa na frente, dentro de nove semanas.
  É o maior custo de escopo assumido conscientemente neste projeto.
- A agenda multi-profissional passa a ter duas soluções de interface distintas para o mesmo
  dado — mais superfície de bug e de teste.
- Densidade em 390px conflita com o alvo de 44px: menos informação por tela, mais rolagem.
  Onde os dois brigarem, **o alvo de toque ganha**.
- Aumenta o custo do RNF-04 (Lighthouse mobile ≥ 85 perf, ≥ 95 a11y), que agora vale para
  o painel também.

### O que passa a ser proibido

- Entregar tela de painel sem versão de 390px.
- Controle com alvo de toque abaixo de 44px, inclusive em tabela e célula de agenda.
- Rolagem horizontal no corpo da página — só dentro de contêiner de tabela ou diagrama.
- Tratar o PWA como opcional.

## Como saber que erramos

- Se as entrevistas com prestadores mostrarem que todos operam por computador, a premissa de
  inclusão perde apoio empírico — e isso precisa ser **registrado como resultado negativo**,
  não omitido.
- Se a paridade mobile consumir tanto tempo que a fatia vertical não fechar até a semana 5,
  o custo foi subestimado e o escopo precisa ser cortado em outro lugar.
- Se o Lighthouse mobile do painel não atingir 85 de performance com a lista cronológica,
  o redesenho da agenda precisa ser revisto.

## Referências

- `PROJECT-CONTEXT.md` §4.1 — reversão registrada · §9 — RNF-04
- `CLAUDE.md` §3.1
- `docs/design/componentes-e-telas.md` — decisão anterior, aqui revogada
- `docs/produto/modelo-de-dominio.md` §4 — `Business.Activate()` e seus pré-requisitos
- ⚠️ A premissa sobre acesso a computador é **inferência**, não dado coletado.
  Ver `docs/tcc/` quando as entrevistas forem realizadas.
