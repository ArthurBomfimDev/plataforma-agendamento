# PROJECT-CONTEXT.md

> Contexto compartilhado entre sessões (Claude, Claude Code, Figma).
> Leia este arquivo primeiro; só abra os documentos longos se a tarefa exigir.
> **Última atualização:** 2026-09-08 · Fase: **definição concluída, início do desenvolvimento**

---

## 1. O que é

Marketplace SaaS de descoberta e agendamento de serviços, web e mobile (PWA). Dois lados: consumidor que busca e agenda, estabelecimento que gerencia agenda, catálogo e equipe.

Também é o **TCC** de Arthur Bomfim e Rafael Ernandes — FATEC Garça, ADS, orientadora Prof.ª Dr.ª Cláudia Maria Bernava Aguillar. Defesa em dezembro/2026.

**Nome da marca:** ⚠️ **indefinido.** "Agendeaki", "Agendify", "Vagoo" e "Kairo" descartados. Ver §12.
⚠️ **O nome não bloqueia mais nada.** Repositório usa nome provisório; renomear no GitHub é instantâneo e mantém redirecionamento.

| Pessoa | GitHub | Frente |
|---|---|---|
| Arthur Bomfim | `ArthurBomfimDev` | Backend, arquitetura, banco, infra |
| Rafael Ernandes | `RafaelErnandes` | Frontend, design system |

---

## 2. Estado atual

**Código:** zero linhas. `.git` inicializado, sem commits, sem remote.
**Design:** Etapas 1–6 concluídas (eixo, paleta, tipografia, tokens, componentes, 20 telas aplicadas).
**Ambiente (Arthur):** `.NET SDK 10.0.100` · `Node 22.16` · `Docker 28.3.2` · `gh 2.98` (não autenticado)
**Figma:** `https://www.figma.com/design/E2M0TJehjcrSk4uaXlHI0s` — assento do Rafael é **View** (limita escrita via MCP).

---

## 3. Documentos

| Arquivo | Conteúdo |
|---|---|
| `docs/produto/decisoes-produto-blocos-1-2.md` | Glossário canônico, núcleo, atores, busca, cortes |
| `docs/produto/modelo-de-dominio.md` | 17 entidades, 7 objetos de valor, invariantes, máquina de estados |
| `docs/design/eixo-paleta-tipografia.md` | Eixo, paleta, tipografia, 128 tokens no Figma |
| `docs/design/componentes-e-telas.md` | 11 component sets, 20 telas, padrões de adaptação |
| `docs/contexto/*` | Material original. ⚠️ `05_Agendeaki_Pitch_TCC.md` **não usar como fonte** |

---

## 4. Decisões fechadas — técnicas

| # | Decisão |
|---|---|
| 1 | Frontend **React + TypeScript + Vite** (confirmado; não haverá Next.js) |
| 2 | Backend **C# / ASP.NET Core (.NET 10)** |
| 3 | **PostgreSQL + PostGIS** — extensão é requisito duro de hospedagem |
| 4 | **Monólito modular** |
| 5 | **Monorepo** único, CODEOWNERS por pasta |
| 6 | **Código e domínio em inglês**; produto e TCC em português |
| 7 | **GitHub Projects** como Kanban |
| 8 | **Pagamento fora do MVP** — só a porta `IPaymentGateway` |
| 9 | **Sem exames, laudos, prontuários ou anexos clínicos** |
| 10 | Verticais: **beleza/bem-estar** funcional + 1 tenant de saúde de agendamento |
| 11 | **PWA primeiro**; Capacitor e Tauri consomem o mesmo build |
| 12 | Evidência do TCC: **demonstração controlada** (§9) |
| 13 | Orçamento próximo de zero |
| 14 | **Multi-tenancy por coluna** `business_id`, banco e schema únicos, filtro global no EF Core + RLS |
| 15 | **Dupla reserva prevenida por `EXCLUDE USING gist`**. Redis e lock distribuído rejeitados |
| 16 | **Slot é cálculo, não tabela** |
| 17 | **Snapshot de preço, duração e nome** no `Appointment` |
| 18 | Banco **local** por enquanto. Hospedagem sem pressa |

### 4.1 ⚠️ REVERSÃO — paridade mobile completa

**Todas as telas do painel do estabelecimento terão versão mobile (390px).** Isso revoga a decisão registrada em `componentes-e-telas.md` de que o painel seria apenas desktop.

**Motivo:** no cenário brasileiro, o barbeiro, a manicure ou o autônomo que trabalha sozinho tem celular e não tem computador. Restringir telas ao desktop é decidir quem pode usar o sistema. **É decisão de inclusão digital, não de conveniência** — e como tal tem justificativa própria no capítulo de justificativa do TCC.

Consequências obrigatórias:
- O painel passa a ser **mobile-first** também. As 6 regras de empacotamento e a safe-area valem para ele.
- **PWA sobe de prioridade**: instalação, ícone, splash e offline básico entram no escopo, não em "se sobrar tempo".
- **Alvo de toque de 44px em todo controle do painel**, inclusive nos densos, hoje desenhados para mouse.
- Única tela que exige redesenho real, não refluxo: **agenda do dia multi-profissional**. Padrão adotado: um profissional por vez, seletor horizontal de profissionais no topo, dia como lista cronológica. Relatórios viram cartões empilhados com rolagem horizontal na tabela.

### 4.2 Bibliotecas de calendário — orientação

- `react-day-picker` para **seleção de data** (headless, sem dependências, base do shadcn/ui).
- Agenda do painel: **construir a grade à mão** em vez de adotar scheduler. Blocos posicionados por `top`/`height` calculados. Adotar `react-big-calendar` ou FullCalendar traz modelo de dados e sistema de temas para brigar em cada customização — e vocês customizam tudo (feriado, transbordo, pendente tracejado). A visão por recurso do FullCalendar (coluna por profissional) é da edição **paga**.
- Nenhuma biblioteca de UI resolve o `AvailabilityCalculator`. A biblioteca desenha; a regra é nossa.

---

## 5. Decisões fechadas — produto

### Glossário — a palavra "cliente" está banida

`Business` (empresa/tenant) · `Owner` · `Professional` · `Customer` (consumidor) · `Service` · `Appointment` · `Availability`

### Identidade e papéis

Conta de `Customer` obrigatória e **global**, fora do tenant. `Owner` e `Professional` são **papéis**, não tipos de conta. `Professional` pertence a **uma** empresa. Perfil do profissional é público, com consentimento. Escolha de profissional é opcional ("sem preferência" por padrão). Quarto papel: **`Admin` da plataforma**.

### Agendamento

| Regra | Valor |
|---|---|
| Slots | Derivados da duração; granularidade **por serviço**, padrão 15 min |
| Jornada | Semanal recorrente, configurada pelo estabelecimento |
| Buffer | Antes/depois, no `Service`, padrão 0 |
| Antecedência mínima | Padrão 2 h, configurável |
| Horizonte | Padrão 60 dias, configurável |
| Transbordo do expediente | Tolerância em minutos + aprovação da empresa |
| Serviços por agendamento | Um. Combo vira `Service` próprio |
| Capacidade | 1 atendimento por profissional por vez |
| Confirmação | **Aprovação manual por padrão.** `AutoConfirm` configurável |
| Pendente | Expira em `PendingExpirationHours` (padrão 12) ou na antecedência mínima |
| Estados | `Pending → Confirmed \| Rejected \| Expired \| Cancelled` · `Confirmed → Completed \| NoShow \| Cancelled` |
| Marcação de balcão | Sim, mesma agenda, nasce `Confirmed` |
| Cancelamento | Padrão 24 h. Configurável entre **0 e 48 h** (limite duro) |
| Fuso | UTC no banco, fuso por empresa |

### Feriados

Calculados nacionalmente (fixos + móveis derivados da Páscoa). Sem API, custo zero. Padrão **indisponível**; a empresa escolhe fechado / aberto normal / horário especial. O consumidor **vê que a data é feriado** mesmo quando a empresa abre.

### Bloqueio, folga e férias

Tela única "bloquear período": tipo, intervalo, faixa de horário opcional, motivo. Com agendamentos dentro do período, o sistema lista os afetados e exige escolha: **manter os existentes** (padrão) · cancelar todos com notificação · voltar e ajustar.

### Onboarding e verificação

`Draft` → `PendingReview` → `Active` → `Suspended`. Checklist: CNPJ/CPF, endereço geocodificável, ≥1 serviço, ≥1 profissional, ≥1 jornada, ≥1 foto. CNPJ validado por formato e dígito verificador, offline.
`VerificationLevel`: `Unverified` → `UnderReview` → `Verified` | `Rejected`. Conferência manual pelo `Admin`. **Sem upload de documento no MVP.** Selo "verificado" na vitrine.

### Colaboradores

Convite por e-mail. `SeatLimit` no `Business`, definido pelo `Admin`. Cobrança por assento não existe no MVP.

### Busca

Serviço · estabelecimento · profissional · localização (raio 5/10 km ou cidade/bairro) · **disponibilidade + serviço**.
Ordem obrigatória: filtro geográfico (PostGIS) → textual → cálculo de slots só nos candidatos → janela de 7 dias → paginação. Se o tempo apertar, **disponibilidade + serviço é a primeira dimensão a cortar**.

### Avaliação

Só de agendamento `Completed`, um por agendamento, sem edição, prazo de 30 dias. Avalia o **estabelecimento**. `Owner` responde.

### Relatórios — v1 reduzida

Uma tela, seletor de período, quatro números: agendamentos por status · receita prevista · taxa de ocupação · **tempo médio de resposta a pedidos**. Um gráfico + exportação CSV.
"Receita prevista" — nunca "faturamento" ou "lucro". O sistema não processa dinheiro.

### Mídia

Fotos: até 10 por empresa, 3 por serviço, WebP, redimensionadas no upload. **Vídeo não hospedado** — link para YouTube/Instagram como embed.

---

## 6. Matriz de permissões

| Ação | Customer | Professional | Owner | Admin |
|---|---|---|---|---|
| Agendar / cancelar o próprio | ✅ | — | — | — |
| Avaliar agendamento concluído | ✅ | — | — | — |
| Ver a própria agenda | — | ✅ | ✅ | — |
| Ver agenda de todos | — | ❌ | ✅ | — |
| Aceitar / recusar pedido | — | ✅ só seus | ✅ | — |
| Cancelar agendamento | — | ✅ só seus | ✅ | — |
| Marcar concluído / no-show | — | ✅ só seus | ✅ | — |
| Marcação de balcão | — | ✅ só sua agenda | ✅ | — |
| Editar jornada | — | ❌ | ✅ | — |
| Bloqueio / folga / férias | — | ❌ | ✅ | — |
| Criar / editar serviço e preço | — | ❌ | ✅ | — |
| Convidar / remover colaborador | — | ❌ | ✅ | — |
| Responder avaliação | — | ❌ | ✅ | — |
| Configurar política de agendamento | — | ❌ | ✅ | — |
| Ver financeiro da empresa | — | ❌ | ✅ | — |
| Relatório dos próprios serviços | — | ✅ | ✅ | — |
| Aprovar / verificar / suspender empresa | — | — | — | ✅ |

---

## 7. Notificações

Canais no MVP: **e-mail + in-app**. WhatsApp é trabalho futuro. Agenda: **anexo `.ics`** no e-mail de confirmação; sem Google Calendar API.

| Evento | Para quem |
|---|---|
| Pedido criado | Empresa e profissional |
| Confirmado | Consumidor (+ `.ics`) |
| Recusado / expirado | Consumidor |
| 24 h antes | Consumidor |
| 3 h antes | Consumidor (in-app) |
| Início do dia | Profissional |
| Cancelamento | A outra parte |
| 2 h após conclusão | Consumidor (avaliação) |

Publicação via **Outbox**, na mesma transação da escrita.

---

## 8. Design system — estado atual

**Eixo:** híbrido, base "precisão calma" com calor de "ofício". É clara, confiável, acolhedora. Não é corporativa, fria, genérica. Quando calor e legibilidade brigam, legibilidade ganha.

**Primária:** azul-água. Ação em `#0F6E83` (P600). Tons claros nunca são fundo de botão.
**Secundária:** argila `#8E5426` (texto) / `#C97F4A` (não-texto).
**Neutros quentes**, 11 passos. Borda de componente interativo usa **N500 `#8C867B`**, nunca N300.
**Risco registrado:** vizinhança cromática com Calendly, Google Calendar e Doctoralia. A diferenciação depende de tipografia, forma e temperatura dos neutros.

**Tipografia:** IBM Plex Sans (interface, corpo, painel inteiro) + Source Serif 4 (só `display` e `title` da vitrine). Ambas OFL. **Zero serifada no painel.** Campo de formulário obrigatoriamente 16px.

**Tokens:** 4 coleções, 128 variáveis, modo Light, zero `ALL_SCOPES`, arquitetura primitiva → alias semântico. Componentes ligam só em tokens semânticos.

**Componentes:** 11 component sets, 215 nós auditados, zero valor hardcoded.

**Telas:** 20 (12 originais + 8 versões desktop do consumidor), 1.379 nós, 0 instâncias soltas, 0 cores hardcoded.

**Status do agendamento sempre em dois canais** — cor + forma/ícone. `Pending` e `Confirmed` diferem em quatro canais.

**Modo escuro:** fora de escopo.

---

## 9. TCC — método e evidência

**Método proposto: Design Science Research (DSR).** Demonstração e avaliação são etapas formais do método. ⚠️ **Depende de aprovação da orientadora.**

Caminhos: **A** teste com usuários (8–12 consumidores, 3–5 prestadores) · **B** avaliação heurística (3–5 avaliadores) · **C** heurística → correção → teste.

**Hipóteses reescritas**, com limiar declarado antes da coleta:
- **H1′** — ≥ 85% concluem um agendamento sem ajuda, na primeira tentativa.
- **H2′** — SUS médio ≥ 68.
- **H3′** — o prestador configura serviço, profissional e jornada sozinho em < 10 min.

⚠️ Com aprovação manual como padrão, H1 muda de "elimina a espera" para "reduz a espera e torna o estado do pedido visível".
As 4 hipóteses originais são de mercado e vão para o capítulo de limitações.

**Novo argumento de justificativa:** paridade mobile como decisão de inclusão digital (§4.1).

### RNFs medíveis

| ID | Meta | Medição |
|---|---|---|
| RNF-01 | Busca com slots: p95 ≤ 800 ms, 30 empresas semeadas | k6 |
| RNF-02 | Cálculo de disponibilidade: p95 ≤ 200 ms | Teste cronometrado |
| RNF-03 | Zero dupla reserva sob 50 requisições concorrentes | Teste de integração |
| RNF-04 | Lighthouse mobile ≥ 85 perf, ≥ 95 a11y | CI |
| RNF-05 | Da busca à confirmação em ≤ 4 passos | Contagem |
| RNF-06 | Argon2id, TLS, zero dado sensível em página pública | Checklist |

**Uptime não entra** — não é mensurável nem garantível em free tier.

### Dados semeados

30 empresas na mesma cidade com coordenadas reais, 2 verticais, 3–5 profissionais cada, jornadas variadas, 60 dias de histórico com avaliações e no-shows, agenda futura parcialmente ocupada. **Script versionado e reexecutável.**

---

## 10. Fora do MVP

Chat com o estabelecimento · posts e feed · pagamento, Pix, split, carteira, caução · planos com cobrança · estoque · convênio com lógica (fica booleano informativo) · promoções e cupons · recomendação por IA · WhatsApp e Instagram · programa de indicação · categorias além de beleza e saúde · profissional em múltiplas empresas · recursos compartilhados · atendimento domiciliar e online · vídeo hospedado · upload de documento de verificação · modo escuro.

Substituto do chat: campo de observação estruturado + telefone da empresa visível após confirmação.

---

## 11. Contradições resolvidas — não reabrir

| Origem | Resolução |
|---|---|
| Pitch: React Native + Node/NestJS + AWS | Descartado. Vale React + Vite + .NET. Precisa de **ADR-002** |
| Pitch: Pix, split e carteira | Fora do MVP |
| Documento mestre: Trello | GitHub Projects |
| Gemini: 6 categorias | Duas verticais |
| Gemini: `acceptsInsurance` funcional | Booleano informativo |
| Gemini: RNF cita "prontuários" | **Nunca haverá prontuário** |
| Gemini: uptime ≥ 99,8% | Número inventado, removido |
| Gemini: lock em Redis | Rejeitado — constraint de exclusão |
| Gemini: inspiração visual no iFood | Apenas **estrutural** |
| Protótipos: slots hardcoded | Não havia modelo de disponibilidade em nenhum |
| "autoconfirm por padrão" | **Aprovação manual é o padrão** |
| "Vite vai sair" | **Vite fica.** Não haverá Next.js |
| "Painel só desktop" | **Revogado.** Paridade mobile completa (§4.1) |

---

## 12. Pendências abertas

| # | Pendência | Bloqueia | Quem |
|---|---|---|---|
| A | Nome da marca | Logotipo, marca nominativa, slogan | Ambos |
| B | `gh auth login --scopes "repo,workflow,read:org,project"` | Repo, Project, CI | Arthur |
| C | Repositório público (recomendado) ou privado | Actions e proteção de branch | Ambos |
| **F** | **Comitê de Ética + aceitação do DSR** | Coleta em outubro | Perguntar à orientadora |
| G | Hospedagem com PostGIS habilitável | Migration e deploy | Arthur |
| H | **Etapa 7 do Figma** — telas faltantes + paridade mobile do painel | Fatia vertical | Rafael |
| I | E-mail `@fatec.sp.gov.br` ativo? (Azure for Students) | Cold start na defesa | Ambos |
| J | Assento Figma do Rafael é **View** — limita escrita via MCP | Automação de design | Rafael |

**Já verificado:** `encaixe.com.br` e `agendei.com.br` registrados. **Vagoo** colide com Vagaro (agendamento de salão/spa) e com a Vagoo logística. **Kairo** colide com Kairos/DIMEP.

---

## 13. ADRs a escrever

| ID | Tema |
|---|---|
| 001 | Stack: React + Vite + .NET 10 + PostgreSQL |
| 002 | Revogação do pitch |
| 003 | Multi-tenancy por coluna |
| 004 | Identidade, papéis e conta global do consumidor |
| 005 | Dupla reserva por constraint de exclusão |
| 006 | Slot calculado, não persistido |
| 007 | Monólito modular e fronteiras de módulo |
| 008 | Hospedagem e PostGIS |
| 009 | Paridade mobile do painel como decisão de inclusão |

---

## 14. Skills

**12 ativas**, ainda com prefixo `agendeaki-`: `api-design` · `backend-dotnet` · `code-review` · `context-economy` · `finops` · `frontend-react` · `marketplace-growth` · `messaging` · `performance` · `security` · `tcc-writer` · `vertical-slice`

⚠️ **Remover o prefixo de marca.** Skill se nomeia por função.

**Em `.agents/skills/` (3):** `find-skills` · `product-name` · `brand-identity`

**Regra das três vezes:** só vira skill o que for escrito como instrução três vezes.

---

## 15. Restrições permanentes

- **~9 semanas** até a 2ª semana de novembro, duas pessoas em tempo parcial, com o texto do TCC na mesma janela.
- **Orçamento ~zero.** GitHub Student Pack → Azure for Students → free tiers → VPS pago em último caso.
- **LGPD Art. 11:** em categoria de saúde, o próprio agendamento já é dado sensível. Consentimento específico e destacado que **bloqueia**, ausência em página pública, log de acesso.
- **Nunca:** segredo no repositório, `.env` commitado, token em documento, credencial inventada.

---

## 16. Regras de trabalho

1. **Não implementar sem aprovação humana explícita.**
2. Separar **evidência / interpretação / hipótese / decisão**. Nunca inventar entrevista, métrica ou referência.
3. Toda decisão arquitetural vira **ADR**.
4. Revisão humana obrigatória em: autenticação, autorização, multi-tenancy, dado de saúde, migration, infraestrutura.
5. **Fatia vertical antes de largura.** Fatia 1: empresa → serviço → profissional → jornada → horário → consumidor agenda → empresa aprova → empresa visualiza.
6. Antes de adicionar complexidade: *que problema concreto isso resolve?*
7. **Economia de contexto:** carregar só as skills necessárias; ler só a seção necessária.
8. Respostas e documentação em **português**.

---

## 17. Próximo passo

1. Perguntar à orientadora: DSR + Comitê de Ética.
2. **Spike de infraestrutura (1 h):** `CREATE EXTENSION postgis` e `btree_gist` no candidato a hospedagem. Maior risco técnico não verificado.
3. `gh auth` → repositório com nome provisório → `CLAUDE.md` → estrutura → CI → Project.
4. ADRs já decididos (001, 003, 004, 005, 006, 007, 009).
5. Etapa 7 do Figma em paralelo, priorizando o que a fatia 1 consome.
