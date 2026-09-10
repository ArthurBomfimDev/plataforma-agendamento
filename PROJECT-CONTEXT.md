# PROJECT-CONTEXT.md

> Contexto compartilhado entre sessões (Claude e Claude Code).
> Índice de baixo custo: leia este arquivo primeiro; só abra os documentos longos se a tarefa exigir.
> **Última atualização:** 2026-09-03 · Fase atual: **descoberta / definição** — nenhuma implementação iniciada.

---

## 1. O que é

Marketplace SaaS de descoberta e agendamento de serviços ("iFood dos agendamentos"), web e mobile.
Também é o **TCC** de Arthur Bomfim e Rafael Ernandes — FATEC Garça, ADS, orientadora Prof.ª Dr.ª Cláudia Maria Bernava Aguillar. Defesa em dezembro/2026.

**Nome de trabalho:** Agendeaki — ⚠️ **em processo de substituição**, ver §5.

| Pessoa | GitHub | Frente |
|---|---|---|
| Arthur Bomfim | `ArthurBomfimDev` | Backend, arquitetura, banco, infra |
| Rafael Ernandes | `RafaelErnandes` | Frontend, design system |

Máquinas separadas, contas GitHub separadas, mesma conta Claude.

---

## 2. Estado real do repositório

**Nada foi implementado. Zero linhas de código.**

| Caminho | Estado |
|---|---|
| `.git/` | Inicializado, **zero commits**, **sem remote** |
| `README.md` | Existe, **vazio** (0 bytes), em staging |
| `src/`, `tests/` | Existem e estão **completamente vazios** |
| `docs/contexto/` | 5 documentos importados (ver §3) |
| `.agents/skills/` | 3 skills instaladas via `npx skills` |
| `.claude/skills/` | Symlinks das skills para o Claude Code |
| `skills-lock.json` | Lockfile das skills instaladas |
| `PROJECT-CONTEXT.md` | Este arquivo |

**Não existe ainda:** repositório remoto, `CLAUDE.md`, `.github/`, ADRs, `docs/ai/`, `docs/tcc/`, agentes, CI, Project, issues.

### Ambiente verificado (máquina do Arthur)

`.NET SDK 10.0.100` · `Node 22.16` · `Docker 28.3.2` · `gh 2.98` **(não autenticado)`

---

## 3. Documentos de referência

| Arquivo | Conteúdo | Quando abrir |
|---|---|---|
| `docs/contexto/Agendaki_Contexto_Claude.md` | Documento mestre, 45 seções — produto, arquitetura, skills, processo | Só a seção necessária; é longo |
| `docs/contexto/03_Projeto_Agendamento_TCC_1.md` | Projeto de pesquisa entregue à FATEC — objetivos, metodologia, cronograma, 3 referências | Ao escrever o TCC |
| `docs/contexto/02_Apresentacao_do_Tema.md` | Tema, problema, justificativa, 4 hipóteses | Ao escrever o TCC |
| `docs/contexto/04_Projeto_Agendamento_TCC_2.md` | Versão 2 do projeto de pesquisa | Comparar com a v1 |
| `docs/contexto/05_Agendeaki_Pitch_TCC.md` | Pitch de apresentação | ⚠️ **Não usar como fonte** — ver §7 |

**Blueprint técnico completo (proposta):** https://claude.ai/code/artifact/49ad61fb-1caf-4c87-87c5-c241d8f71e20

---

## 4. Decisões fechadas

Confirmadas pelo Arthur. Não reabrir sem motivo novo.

| # | Decisão |
|---|---|
| 1 | Frontend **React + TypeScript + Vite** |
| 2 | Backend **C# / ASP.NET Core (.NET 10)** |
| 3 | **PostgreSQL** |
| 4 | **Monólito modular** — microsserviços descartados |
| 5 | **Monorepo** único, CODEOWNERS por pasta |
| 6 | **Código e domínio em inglês**; produto e TCC em português |
| 7 | **GitHub Projects** como Kanban oficial — Trello descartado |
| 8 | **Pagamento fora do MVP** — só a porta (`IPaymentGateway`), sem adaptador |
| 9 | **Sem exames, laudos ou anexos clínicos** |
| 10 | Verticais: **beleza/bem-estar + saúde de agendamento** (sem dado clínico) |
| 11 | Telas serão **redesenhadas do zero** — nada aproveitado |
| 12 | **PWA primeiro**; Capacitor e Tauri consomem o mesmo build, decisão adiável |
| 13 | Evidência do TCC: **demonstração controlada**, não piloto de campo |
| 14 | Orçamento próximo de zero; gasto aceitável na casa de dezenas de reais |

---

## 5. Decisões em aberto — bloqueiam progresso

| # | Pendência | Bloqueia | Quem resolve |
|---|---|---|---|
| A | **Nome definitivo da marca.** "Agendeaki" foi escolhido às pressas e será substituído | Criação do repositório e nomeação das skills | Arthur + Rafael |
| B | `gh auth login` com escopos `repo,workflow,read:org,project` | Criar repo, Project, issues, CI | Arthur |
| C | Repositório **público** ou privado (recomendado: público) | Proteção de branch e minutos de Actions | Ambos |
| D | Eixo de marca: paleta, tipografia, símbolo | Design system e primeiras telas | Ambos |
| E | Aprovação do recorte de MVP proposto no blueprint | Planejamento das milestones | Ambos |
| F | **Comitê de Ética** — a FATEC exige submissão a CEP? | Coleta de qualquer dado com participantes | Perguntar à orientadora |

### Brief de naming — 3 respostas necessárias

1. Nome descritivo, evocativo ou abstrato/inventado?
2. Precisa funcionar em inglês, ou mercado brasileiro assumido?
3. Alguma palavra vetada?

**Já verificado no Registro.br:** `encaixe.com.br` e `agendei.com.br` estão **registrados e ativos**. Disponibilidade de domínio é filtro de entrada, não checagem final.

---

## 6. Skills e agentes

### Instaladas e ativas

**Do plugin `anthropic-skills` (12, prefixo `agendeaki-`):**
`api-design` · `backend-dotnet` · `code-review` · `context-economy` · `finops` · `frontend-react` · `marketplace-growth` · `messaging` · `performance` · `security` · `tcc-writer` · `vertical-slice`

**Em `.agents/skills/` (3, via `npx skills`):**

| Skill | Fonte | Uso |
|---|---|---|
| `find-skills` | `vercel-labs/skills` | Buscar skills no ecossistema |
| `product-name` | `phuryn/pm-skills` | Naming — pendência A |
| `brand-identity` | `arnabbagxd/brand-building-skills` | Identidade visual — pendência D |

⚠️ As 12 skills têm prefixo `agendeaki-`. **Se o nome mudar, elas precisam ser renomeadas.**

### Propostas, não criadas

7 skills novas: `scheduling`, `multi-tenancy`, `database`, `design-system`, `architecture`, `planner`, `evidence-journal`.
4 agentes: `architect`, `implementer-backend`, `implementer-frontend`, `reviewer`.

**Regra das três vezes:** só vira skill o que for escrito como instrução três vezes. Não criar as 23 skills do documento mestre.

---

## 7. Contradições resolvidas — não reabrir

| Contradição | Resolução |
|---|---|
| Pitch declara React Native + Node/NestJS + AWS | **Descartado.** Vale React + .NET. O pitch foi feito às pressas com IA, sem revisão. Precisa de **ADR-002** |
| Pitch promete Pix, split e carteira como diferencial | **Fora do MVP.** Vira trabalho futuro no texto |
| Documento mestre define Trello como painel | **Descartado** em favor de GitHub Projects |
| README de repositório antigo definia microsserviços + Blazor + MAUI | Repositórios **apagados** pelo Arthur. Sem resíduo |
| "Ignorar prazos" × "prazo é a 2ª semana de novembro" | O prazo **vale** e recorta o escopo; o que não se aplica é pressa para começar a codar |

---

## 8. Restrições permanentes

- **~10 semanas** de desenvolvimento até a 2ª semana de novembro, duas pessoas em tempo parcial, com o texto do TCC na mesma janela.
- **Orçamento ~zero.** Ordem: GitHub Student Pack (US$ 200 DigitalOcean) → Azure for Students (US$ 100) → free tiers → VPS pago em último caso.
- **LGPD Art. 11:** em categoria de saúde, o **próprio agendamento já é dado sensível**. Exige consentimento específico e destacado, ausência em página pública e log de acesso. Não é opcional.
- **Nunca:** segredo no repositório, `.env` commitado, token em documento, credencial inventada, dado sensível sem justificativa.

---

## 9. Regras de trabalho

1. **Não implementar sem aprovação humana explícita.** A fase atual é de definição.
2. Separar sempre **evidência / interpretação / hipótese / decisão**. Nunca inventar entrevista, métrica ou referência.
3. Toda decisão arquitetural vira **ADR** em `docs/decisions/`.
4. Revisão humana obrigatória em: autenticação, autorização, multi-tenancy, dado de saúde, migration, infraestrutura.
5. **Fatia vertical antes de largura.** Primeira fatia: empresa → serviço → profissional → disponibilidade → horário → cliente agenda → empresa visualiza.
6. Antes de adicionar complexidade: *que problema concreto isso resolve?*
7. **Economia de contexto:** carregar só as skills necessárias; ler só a seção necessária de documento longo; não duplicar informação entre documentos.
8. Respostas e documentação em **português**.

---

## 10. Próximo passo

Fechar o **nome** (pendência A) e autenticar o **`gh`** (pendência B). Com os dois, saem em sequência: repositório, `CLAUDE.md`, estrutura de pastas, `.github/`, Project, labels, milestones, CODEOWNERS, workflows e regras de proteção.

Nada disso deve ser criado antes.
