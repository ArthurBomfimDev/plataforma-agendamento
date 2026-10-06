# Fontes e armadilhas

## Hierarquia de fontes — quando dois documentos divergem

Vale o mais recente e mais específico. Em caso de dúvida, perguntar ao usuário e registrar a resposta.

| Ordem | Documento | Data | Vale para |
|---|---|---|---|
| 1 | **Repositório** (código, testes, `docs/decisions/` ADRs) | atual | O que de fato foi implementado e decidido em ADR |
| 2 | `docs/DOCUMENTO-GERAL.md` | 28/09/2026 | Visão consolidada, **recorte de entrega (§12)**, limitações (§13) |
| 3 | `docs/produto/decisoes-localizacao-notificacao-modelo.md` | 22/09/2026 | Correções do modelo, identidade, localização, notificação |
| 4 | `docs/produto/modelo-de-dominio.md` · `decisoes-produto-blocos-1-2.md` | set/2026 | Entidades, invariantes, glossário — **corrigidos pelo item 3** |
| 5 | `docs/design/eixo-paleta-tipografia.md` (R3, 10/09) · `componentes-e-telas.md` | set/2026 | Design. **O arquivo Figma é a fonte da verdade** |
| 6 | `PROJECT-CONTEXT.md` | 04/09/2026 | Índice e regras de trabalho. Desatualizado em estado do repositório e contagens |
| 7 | `02_Apresentacao_do_Tema.md` · `03`/`04_Projeto_Agendamento_TCC` | anterior | Problema, justificativa, hipóteses originais. **Regras de produto ali estão superadas** |
| ✗ | `05_Agendeaki_Pitch_TCC.md` | — | **Nunca usar** |

## Decisões que mudaram — não escrever a versão antiga

| Versão antiga (errada) | Versão vigente |
|---|---|
| Autoconfirmação por padrão; "elimina a espera" | **Aprovação manual por padrão**, autoconfirmação configurável; "reduz a espera e torna visível o estado do pedido" |
| 17 entidades, 8 módulos, `Category` como tabela | **19 entidades, 9 módulos** (+ `Notifications`), **20 tabelas** com a `outbox`; `Category` é **enum** |
| React Native + Node/NestJS + AWS (pitch) | React + TypeScript + Vite · .NET 10 · PostgreSQL + PostGIS |
| Microsserviços | **Monólito modular** com fronteira verificada por teste de arquitetura |
| Lock em Redis contra dupla reserva | **`EXCLUDE USING gist`** no PostgreSQL; estados que ocupam: `Pending`, `Confirmed`, `Completed`, `NoShow` |
| Trello | GitHub Projects |
| Lembretes 24 h e 3 h | `ReminderOffsetsHours`, padrão **[24, 1]** — e notificação por e-mail está **fora do recorte** |
| Avaliação só do estabelecimento | Avalia o estabelecimento, **nota opcional do profissional** — e avaliações estão **fora do recorte** |
| Perfil do profissional público com consentimento | **Nome sempre público**; foto/bio/certificações exigem consentimento |
| Qualquer idade | **18 anos mínimo**; menor é agendado pela conta de um adulto (Art. 14 fora do escopo) |
| CPF no cadastro | CPF **opcional**, só no agendamento de categoria sensível, cifrado |
| "Endereço geocodificável" | **Ponto confirmado pelo dono no mapa**; só entra na busca por raio quem confirmou |
| Seis categorias; convênio funcional | Duas verticais (beleza/bem-estar + 1 estabelecimento de saúde); convênio é booleano informativo |
| Uptime ≥ 99,8% | **Removido** — não é mensurável em free tier |
| Primária `#0F6E83` / `#0B7690`; pendente `#96560A` | Primária **`#0C7D99`**, pendente **`#6B5A00`** (R3) |
| Painel só no desktop | **Painel também em mobile** — decisão de inclusão (profissional autônomo só tem celular) |
| Hipóteses de mercado (adesão, confiança, eficiência, descoberta) | **H1–H3 de usabilidade**; as de mercado vão para limitações |

## Recorte de entrega (DOCUMENTO-GERAL §12)

**Entra:** fatia vertical completa (cadastro do estabelecimento → serviço → profissional → jornada → horários → agendamento → aprovação → agenda) · busca pública geográfica e por disponibilidade · prova de concorrência do RNF-03 · tratamento de dado sensível em saúde · autenticação, cadastro e recuperação de senha.

**Trabalho futuro, declarado:** avaliações · notificação por e-mail · upload de fotos · PWA instalável · painel de indicadores · painel administrativo de aprovação · tudo que já estava fora do MVP (pagamento, WhatsApp, chat, estoque, cupons, IA etc.).

Consequência no texto: módulos **projetados mas não entregues** (ex.: `Reputation`, `Notifications`, Outbox) aparecem na 2.2/2.3 como desenho, no tempo verbal de projeto, e são retomados em trabalhos futuros.

## Estado de implementação

Não está documentado de forma confiável fora do repositório. Relato dos autores (out/2026): frontend construído, backend estruturado, testes pendentes. **Antes de escrever "implementado", conferir no repositório** e citar o caminho; no chat, marcar `[VERIFICAR NO REPO]`.
