## 0. Antes de qualquer tarefa — roteador de skills

Toda tarefa deste projeto começa pela skill `agendeaki-context-economy`. Ela decide, em até
3 linhas de raciocínio e sem expor a decisão ao usuário: qual skill carregar (no máximo 2),
se a tarefa roda em Cowork ou em Claude Code, e o que ler — parando assim que bastar.

**Nunca** carregar uma skill "por garantia", nem ler um documento inteiro para achar um
parágrafo. Se a tarefa parecer exigir 3+ skills, ela está grande demais — quebre antes de
começar.

As regras do projeto ficam no `CLAUDE.md` da raiz, carregado junto com este arquivo. Não duplicar aqui.

# graphify

- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
  When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.
