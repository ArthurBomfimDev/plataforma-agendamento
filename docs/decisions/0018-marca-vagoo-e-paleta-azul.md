# ADR-018 — Marca Vagoo e paleta azul

- **Status:** Proposto
- **Data:** 2026-10-26
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** frontend, design system
- **Substitui:** —
- **Substituído por:** —
- **Revoga:** a proibição de azul corporativo, que valia até a revisão 4 da paleta

---

## Contexto

**Fato.** Até a revisão 4 (R4) da paleta, o eixo de marca proibia azul corporativo; a primária era
azul-água (`#0C7D99`), com neutros quentes. O produto não tinha nome (pendência A).

**Fato.** Em 09/10 a marca foi fechada: **Vagoo**, `AGENDE · ESCOLHA · VÁ`, com símbolo em gradiente
ciano → azul (`docs/design/marca-vagoo.md`). "Agendeaki", "Agendify" e "Kairon Place" foram descartados.

**Fato.** A R5 (`docs/design/eixo-paleta-tipografia.md`) segue a marca: primária azul `#3B82F6`
(`primary/500`), neutros slate frios, fundo escuro `#070B14`. Custou uma edição de 35 primitivas, sem
alias alterado e sem tela refeita.

**Fato.** `#3B82F6` com texto branco dá 3,68:1 e reprova em AA para texto de interface. O fundo de botão é
`primary/600` = `#2563EB`, a 5,17:1.

**Fato, estado do código em 26/10.** `frontend/src/styles/tokens.css` está com a R5, nos modos claro e
escuro.

## Problema

O sistema visual deve seguir a marca azul, revogando a proibição de azul, ou manter o eixo anterior e
afastar a marca da interface?

## Alternativas consideradas

### A — Manter o azul-água da R4 e usar a marca só no logotipo

**A favor:** preserva a diferenciação cromática que motivou a proibição.
**Contra:** o logotipo azul sobre uma interface azul-água lê como dois produtos.

### B — Seguir a marca e revogar a proibição de azul

**A favor:** marca e interface coerentes; a arquitetura primitiva → alias absorveu a troca sem refazer tela.
**Contra:** azul é a cor mais disputada da categoria; a diferenciação passa a depender de tipografia, forma,
densidade e dos neutros frios.

### C — Seguir a marca com `#3B82F6` também no fundo do botão, com texto escuro

**A favor:** o azul exato da marca no elemento mais visível.
**Contra:** contradiz o próprio logotipo, que é branco sobre azul.

## Decisão

Adotamos **B**. A marca é **Vagoo**, e a paleta da interface é a **R5**:

- `#3B82F6` (`primary/500`) é o azul da identidade — bordas, foco, ícones, seleção, logotipo.
- O fundo de botão (`action/primary`) é `#2563EB` (`primary/600`), com texto branco a 5,17:1.
- Gradiente ciano → azul só no logotipo e em peças de marca, nunca em interface.
- A proibição de azul corporativo está **revogada**.

O nome técnico do repositório e do namespace `Booking.*` não muda por esta ADR (pendência K).

## Consequências

### O que fica mais fácil

- Marca e interface contam a mesma história.
- O número da R5 (uma edição de 35 primitivas, zero tela refeita) vira evidência da arquitetura de tokens no
  TCC.

### O que fica mais difícil

- A diferenciação visual fica mais difícil — risco declarado no capítulo de limitações.
- Hex das revisões anteriores circulam em prompts e anotações e precisam ser tratados como mortos.

### O que passa a ser proibido

- Usar `#3B82F6` como fundo de texto de interface em tamanho normal.
- Usar gradiente em superfície de interface.
- Reintroduzir hex de R1 a R4 (`#0F6E83`, `#0B7690`, `#0C7D99`, `#4FC3DE`, `#7E7E7B`, `#141413`, `#8C867B`).

## Premissa não verificada

**A diferenciação por tipografia, forma e neutros basta.** Inferência de design, sem teste com usuário. Se
participantes da avaliação confundirem o produto com outro do mesmo mercado, a premissa falhou.

⚠️ não verificado: colisão de nome com **Vagaro** (agendamento de salão) — pendência L, sem decisão nem
consulta ao INPI. Afeta o uso comercial depois do TCC.

## Como saber que erramos

- Se a marca for confundida com concorrente na avaliação de usabilidade.
- Se a pendência L concluir que o nome não pode ser usado.

## Referências

- `docs/design/eixo-paleta-tipografia.md` §0, §2, §3, §5 · `docs/design/marca-vagoo.md`
- `frontend/src/styles/tokens.css`
- `PROJECT-CONTEXT.md` §6, §10, §11 (pendências K e L)
