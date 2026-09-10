# CLAUDE.md

Regras globais do projeto. Curto de propósito — o detalhe mora em `PROJECT-CONTEXT.md` e em `docs/`.

> ⚠️ **Nome provisório.** A marca ainda não existe. Namespace `Booking.*` e o nome do repositório são
> placeholders. Quando o nome for decidido: um find/replace em `Booking` + `gh repo rename`. Nada mais.

---

## 1. Stack e decisões fechadas

| | |
|---|---|
| Frontend | React + TypeScript + **Vite** — confirmado, **não haverá Next.js** |
| Backend | C# / ASP.NET Core (**.NET 10**) |
| Banco | **PostgreSQL + PostGIS** — a extensão é requisito duro de hospedagem |
| Arquitetura | **Monólito modular**, monorepo único |
| Multi-tenancy | Por coluna `business_id`; banco e schema únicos; filtro global no EF Core + RLS |
| Dupla reserva | `EXCLUDE USING gist`. Redis e lock distribuído **rejeitados** |
| Slot | **Cálculo, não tabela** |
| Mobile | **PWA primeiro**; Capacitor e Tauri consomem o mesmo build |
| Pagamento | Fora do MVP. Só a porta `IPaymentGateway`, sem adaptador |

**Fonte de verdade completa:** [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) — leia antes de propor qualquer mudança.
Contradições já resolvidas estão no §11 de lá. **Não reabrir.**

---

## 2. Glossário canônico

Estes são os únicos termos válidos, em código e em documentação:

| Termo | Significado |
|---|---|
| `Business` | A empresa. É o **tenant** |
| `Owner` | Papel de dono do `Business` |
| `Professional` | Papel de quem executa o serviço. Pertence a **um** `Business` |
| `Customer` | O consumidor. Conta **global**, fora do tenant |
| `Service` | O que é oferecido |
| `Appointment` | O agendamento |
| `Availability` | A disponibilidade calculada |

> ### 🚫 A palavra "cliente" está **banida**
> Ela é ambígua nos dois sentidos — ora significa o consumidor, ora a empresa contratante do SaaS —
> e **já causou inversão de significado na documentação anterior**. Em português, escreva
> **"consumidor"** ou **"estabelecimento"**. Em código, `Customer` ou `Business`. Nunca "cliente",
> nunca `Client`.

`Owner` e `Professional` são **papéis**, não tipos de conta. O quarto papel é `Admin` (plataforma).

---

## 3. As 6 regras de empacotamento

Valem **desde o primeiro componente**, sem exceção. O mesmo build alimenta PWA, Capacitor e Tauri —
respeitá-las torna a troca de casca uma configuração; ignorá-las torna uma refatoração de semana.

1. **Camada única de acesso à API.** Tudo passa por `src/lib/api`. `baseURL` vem de variável de ambiente.
2. **Nunca `window.location.origin`.** É o que mais quebra na virada para shell nativo.
3. **Token em vez de cookie de sessão.** Cookie cross-origin dentro de WebView não vale a dor.
4. **Rotas relativas.** Nenhum caminho absoluto para asset.
5. **Recurso nativo sempre atrás de hook próprio** — `useGeolocation`, `useCamera`, `usePush`.
   Nenhum componente chama API do navegador diretamente.
6. **Mobile-first com safe-area.** `env(safe-area-inset-*)`, alvo de toque ≥ 44px, navegação inferior.

### 3.1 Mobile-first vale para o painel também

Decisão registrada no §4.1 do `PROJECT-CONTEXT.md`: **todas as telas do painel do estabelecimento
terão versão mobile de 390px.** Isso revoga a decisão anterior de painel só-desktop.

É **decisão de inclusão digital, não de conveniência** — o barbeiro, a manicure e o autônomo que
trabalha sozinho têm celular e não têm computador. Restringir ao desktop é decidir quem pode usar
o sistema. Tem justificativa própria no capítulo de justificativa do TCC.

Consequências: alvo de toque de **44px em todo controle do painel, inclusive nos densos**;
PWA sobe de prioridade (instalação, ícone, splash, offline básico entram no escopo);
a agenda do dia multi-profissional é a única tela que exige redesenho real —
um profissional por vez, seletor horizontal no topo, dia como lista cronológica.

---

## 4. Regras invioláveis

1. **Nenhum segredo no repositório.** Nenhum `.env` commitado, nenhum token em documento,
   nenhuma credencial inventada. Se falta uma credencial, pare e peça.
2. **Revisão humana obrigatória** em: autenticação · autorização · multi-tenancy ·
   dado de saúde · migration · infraestrutura. Nenhuma IA aprova sozinha nessas áreas.
3. **Toda decisão arquitetural vira ADR** em `docs/decisions/`. Formato Nygard.
4. **Nunca inventar** entrevista, métrica, resultado ou referência bibliográfica.
   Separar sempre **evidência / interpretação / hipótese / decisão**.
5. **Código e domínio em inglês. Documentação e resposta em português.**
6. **Fatia vertical antes de largura.** Nada de "fazer o backend todo" ou "fazer as telas todas".
7. **LGPD Art. 11** — em categoria de saúde, o próprio agendamento já é dado sensível.
   Consentimento específico e destacado que **bloqueia**, ausência em página pública, log de acesso.
8. **Não implementar sem aprovação humana explícita.**

---

## 5. Convenções de código

### Organização por módulo

```
src/
  Booking.Api/                    Host, endpoints, autenticação, composição
  Booking.Modules.Identity/       Conta, login, token, papéis
  Booking.Modules.Tenancy/        Business, onboarding, verificação, assentos
  Booking.Modules.People/         Customer, Professional, vínculos
  Booking.Modules.Catalog/        Service, categoria, preço, duração, buffer
  Booking.Modules.Availability/   Jornada, bloqueio, feriado, cálculo de slot
  Booking.Modules.Scheduling/     Appointment, máquina de estados, transbordo
  Booking.Modules.Reputation/     Avaliação e resposta
  Booking.Modules.Compliance/     Consentimento, auditoria, retenção
  Booking.Shared/                 Tipos base, tenant context, Result, erros
  web/                            App React + TypeScript + Vite
tests/
  Booking.UnitTests/
  Booking.IntegrationTests/
  Booking.ArchitectureTests/
```

**Fronteiras de módulo — quatro regras:**

1. Um módulo **não** referencia tipo interno de outro. Só a interface pública (`ICatalogQueries`).
2. Escrita entre módulos **só por evento de domínio**, publicado via **Outbox** na mesma transação.
3. Nenhuma chave estrangeira atravessa fronteira de módulo.
4. `Booking.ArchitectureTests` **quebra o build** quando 1 ou 3 são violados.
   É isso que impede o monólito modular de virar monólito comum em seis semanas.

### Nomenclatura

| Elemento | Padrão | Exemplo |
|---|---|---|
| Projeto | `Booking.Modules.<Módulo>` | `Booking.Modules.Scheduling` |
| Namespace | Espelha a pasta, escopo de arquivo | `namespace Booking.Modules.Scheduling.Domain;` |
| Classe, método, propriedade | `PascalCase` | `AvailabilityCalculator` |
| Campo privado | `_camelCase` | `_appointmentRepository` |
| Interface | `I` + `PascalCase` | `IPaymentGateway` |
| Tabela e coluna | `snake_case` | `appointment`, `business_id` |
| Endpoint | `kebab-case`, plural | `/api/businesses/{id}/appointments` |
| Componente React | `PascalCase.tsx` | `AppointmentCard.tsx` |
| Hook | `use` + `camelCase` | `useAvailability` |
| Arquivo de token CSS | `kebab-case` | `tokens.css` |

Dinheiro em **centavos, inteiro**. Nunca ponto flutuante.
Data e hora em **UTC** no banco (`timestamptz`), fuso por `Business` como identificador IANA
(`America/Sao_Paulo`) — **nunca offset fixo**, que quebra no horário de verão.

### Commits

Conventional Commits, em português no corpo, escopo pelo módulo:

```
feat(scheduling): calcular slots respeitando buffer do serviço
fix(availability): feriado móvel não considerava a Páscoa
docs(decisions): ADR-005 sobre constraint de exclusão
chore(ci): separar job de formatação do de build
```

Tipos: `feat` · `fix` · `docs` · `refactor` · `test` · `chore` · `perf`.
Um commit resolve uma coisa. Referencie a issue: `Refs #12`.

**Nenhum trailer de atribuição de IA.** Nada de `Co-Authored-By: Claude`, `Claude-Session:`
ou `🤖 Generated with [Claude Code]` nas mensagens de commit e nas descrições de PR.

O repositório versiona um hook que remove esses trailers automaticamente:

```bash
git config core.hooksPath .githooks   # uma vez por clone, obrigatório
```

> ### Por que o hook existe — não apague
> O GitHub lê o trailer `Co-Authored-By` e passa a listar a IA como **Contributor** do
> repositório, ao lado do Arthur e do Rafael. Este é um TCC: a autoria precisa ser inequívoca.
> A ferramenta usada para produzir o trabalho se cita na **metodologia**, não na lista de
> contribuidores. Coautoria humana legítima (`Co-Authored-By: Rafael Ernandes <…>`) passa intacta.
>
> A configuração do cliente resolve só a máquina de quem a configurou; o hook resolve o
> repositório para qualquer pessoa e qualquer ferramenta. Ver `.githooks/commit-msg` e o README.

### Branches

`main` protegida. Trunk-based, sem `develop`.
`feat/<issue>-<slug>` · `fix/<issue>-<slug>` · `docs/<issue>-<slug>` · `chore/<issue>-<slug>`

`enforce_admins` está **desligado** de propósito — a justificativa está no README, seção
"Governança do repositório". A regra continua sendo o PR revisado; a válvula é exceção
registrada, não hábito.

---

## 6. Comandos

```bash
# Backend
dotnet restore
dotnet format --verify-no-changes
dotnet build
dotnet test

# Frontend  (em src/web)
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```

Se um comando ainda não existir, **registre** em vez de inventar saída.

---

## 7. Definition of Done

Uma tarefa só está pronta quando: critérios de aceitação atendidos · testes passando ·
`dotnet format` e lint limpos · autorização e `business_id` revisados · documentação atualizada
quando necessário · ADR escrito se houve decisão arquitetural · PR revisado por humano ·
CI verde · issue e Project atualizados · evidência registrada quando relevante.

---

## 8. Onde encontrar o resto

| Preciso de | Vá para |
|---|---|
| Estado do projeto, decisões, pendências | `PROJECT-CONTEXT.md` |
| Decisões arquiteturais | `docs/decisions/` |
| Modelo de domínio, regras de produto | `docs/produto/` |
| Paleta, tipografia, tokens, componentes | `docs/design/` |
| Método, hipóteses, evidências | `docs/tcc/` |
| Diagramas | `docs/diagramas/` |
| Material original (histórico) | `docs/contexto/` — ⚠️ `05_Agendeaki_Pitch_TCC.md` **não usar como fonte** |

**Economia de contexto:** carregue só as skills necessárias, leia só a seção necessária de
documento longo, reutilize resumo existente. Antes de adicionar complexidade, pergunte:
*que problema concreto isso resolve?*
