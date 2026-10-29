# Decisões arquiteturais (ADRs)

Registro das decisões arquiteturais do projeto, no formato **Nygard**:
contexto · alternativas consideradas · decisão · consequências.

## Por que ADR

Uma decisão que não está escrita é uma decisão que será reaberta. Em um projeto de duas pessoas
com nove semanas e uma banca no fim, reabrir discussão fechada é o desperdício mais caro que existe.

O ADR também é **evidência acadêmica**: ele mostra que a escolha foi fundamentada, com alternativas
avaliadas, e não que caiu do céu. É o que separa "usamos monólito modular" de
"escolhemos monólito modular porque, nas condições X e Y, a alternativa custava Z".

## Como escrever

1. Copie `adr-template.md` para `NNNN-titulo-em-kebab-case.md`.
2. Numere sequencialmente. Número não é reaproveitado, mesmo se o ADR for recusado.
3. Escreva no passado para o contexto e no presente para a decisão.
4. **Nunca invente alternativa de palha.** Se só havia um caminho viável, diga isso e explique por quê.
5. Registre as consequências **ruins** também. ADR sem custo declarado não foi pensado.
6. Adicione a linha na tabela abaixo no mesmo PR.

## Status possíveis

| Status | Significado |
|---|---|
| `Proposto` | Em discussão, ainda não vale |
| `Aceito` | Vale agora. É a regra |
| `Substituído por ADR-NNN` | Não vale mais; outro ADR o sucedeu |
| `Revogado` | Não vale mais e nada o substituiu |

Um ADR aceito **nunca é editado nem apagado** — ele é substituído. O histórico é parte do valor.

---

## Índice

| ID | Título | Status | Data |
|---|---|---|---|
| [001](0001-stack-react-vite-dotnet-postgresql.md) | Stack: React + Vite + .NET 10 + PostgreSQL | ✅ Aceito | 2026-09-09 |
| [002](0002-revogacao-da-stack-do-pitch.md) | Revogação da stack declarada no pitch | 📝 Proposto | 2026-10-26 |
| [003](0003-multi-tenancy-por-coluna.md) | Multi-tenancy por coluna `business_id` | ✅ Aceito | 2026-09-09 |
| [004](0004-identidade-papeis-conta-global.md) | Identidade, papéis e conta global do consumidor | ✅ Aceito | 2026-09-09 |
| [005](0005-dupla-reserva-constraint-exclusao.md) | Prevenção de dupla reserva por constraint de exclusão | ✅ Aceito | 2026-09-09 |
| [006](0006-slot-calculado-nao-persistido.md) | Slot calculado, não persistido | ✅ Aceito | 2026-09-09 |
| [007](0007-monolito-modular-fronteiras.md) | Monólito modular com fronteira de módulo verificada pelo build | ✅ Aceito · reescrita antes do merge | 2026-09-16 |
| [008](0008-hospedagem-postgis-btree-gist.md) | Hospedagem com PostGIS e `btree_gist` | 📝 Proposto — Compose como unidade de implantação (27/10); provedor em aberto | 2026-10-26 |
| [009](0009-paridade-mobile-do-painel.md) | Paridade mobile do painel como decisão de inclusão | ✅ Aceito | 2026-09-09 |
| [010](0010-organizacao-do-backend.md) | Organização do backend: camadas físicas, módulos por namespace e regras verificadas no CI | ✅ Aceito · emendada em 2026-10-01 | 2026-09-16 |
| [011](0011-bun-como-gerenciador-de-pacotes.md) | Bun como gerenciador de pacotes do frontend; Vite permanece o bundler | ✅ Aceito | 2026-09-17 |
| [012](0012-idade-minima-e-agendamento-para-terceiro.md) | Idade mínima de 18 anos e agendamento para terceiro | 📝 Proposto | 2026-10-26 |
| [013](0013-cpf-opcional-e-verificacao-como-porta.md) | CPF opcional e verificação de identidade como porta | 📝 Proposto | 2026-10-26 |
| [014](0014-avaliacao-do-profissional-e-perfil-publico.md) | Avaliação do profissional e perfil público dividido — complementa a 004 | 📝 Proposto | 2026-10-26 |
| [015](0015-categoria-como-enum.md) | Categoria como enum | 📝 Proposto | 2026-10-26 |
| [016](0016-geocodificacao-porta-e-confirmacao.md) | Geocodificação: porta, provedor por fase e confirmação pelo dono | 📝 Proposto | 2026-10-26 |
| [017](0017-intervalo-bloqueado-em-colunas-gravadas.md) | Intervalo bloqueado em colunas gravadas, não coluna gerada — complementa a 005 | 📝 Proposto | 2026-10-26 |
| [018](0018-marca-vagoo-e-paleta-azul.md) | Marca Vagoo e paleta azul — revoga a proibição de azul | 📝 Proposto | 2026-10-26 |
| [019](0019-serializacao-por-profissional-advisory-lock.md) | Serialização por profissional com advisory lock na criação de agendamento — complementa a 005 | 📝 Proposto | 2026-10-27 |
| [020](0020-papel-de-admin-da-plataforma.md) | Papel de Admin da plataforma — complementa a 004 | 📝 Proposto | 2026-10-27 |
| [021](0021-envio-de-email-smtp-generico-e-outbox.md) | Envio de e-mail: SMTP genérico e outbox — complementa a 010 | 📝 Proposto | 2026-10-28 |
| [022](0022-provedores-de-geocodificacao-e-cep.md) | Provedores de geocodificação e CEP, limites e privacidade da coordenada — complementa a 016 | 📝 Proposto | 2026-10-28 |
| [023](0023-imagens-armazenamento-de-arquivos.md) | Imagens: armazenamento de arquivos atrás de porta, processamento com SkiaSharp | 📝 Proposto | 2026-10-28 |

### Notas sobre a fila

- **001 e 002 são par.** O 002 revoga publicamente a stack declarada no pitch entregue à FATEC
  (React Native + Node/NestJS + AWS). Sem ele registrado, a mudança lida pela banca é incoerência;
  com ele, é maturidade de engenharia.
- **007 e 010 são par.** A 007 decide que existe fronteira entre módulos e que ela é verificada;
  a 010 decide a organização física e as sete regras que o CI verifica. A 007 foi reescrita antes
  do merge, quando a fronteira por projeto físico foi trocada por fronteira por namespace.
- **Seção "Premissa não verificada".** Toda ADR que se apoia em premissa não medida declara qual é,
  que ela é inferência, e o que muda se a coleta de dados contradisser. Já está nas ADRs 007 e 010.
  A 009 tem a nota no contexto, ainda fora da seção padronizada. Falta aplicar às demais.
- **005 e 006 sustentam o núcleo técnico do TCC.** São os dois ADRs que a banca tem mais chance
  de questionar e os que rendem mais se estiverem bem escritos.
- **008 depende do spike de infraestrutura** — confirmar `CREATE EXTENSION postgis` e `btree_gist`
  no candidato a hospedagem. É o maior risco técnico ainda não verificado do projeto. A ADR registra
  candidatos e critérios; o provedor só é escolhido com o resultado do spike.
- **012 a 018 registram decisões que já valiam.** As de 012 a 016 vêm do documento de 22/09
  (`docs/produto/decisoes-localizacao-notificacao-modelo.md`); a 017 registra o que a migration
  `AddCoreModules` fez no lugar da coluna gerada; a 018, a marca de 09/10. Entram como `Proposto`: quem
  aceita é humano.
- **005 e 019 são par.** A 005 põe a garantia contra dupla reserva na constraint de exclusão; a 019 ordena
  a fila por profissional com `pg_advisory_xact_lock`, porque o teste de integração mostrou deadlock (`40P01`)
  na checagem da constraint sob disputa. A constraint continua sendo quem recusa a sobreposição.
- **009 tem peso acadêmico próprio**: paridade mobile como decisão de inclusão digital entra
  no capítulo de justificativa, não só no de arquitetura.
