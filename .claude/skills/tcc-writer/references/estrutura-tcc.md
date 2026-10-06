# Estrutura do TCC — relatório técnico-científico

Parte textual alvo: **~18–19 páginas** (limite FATEC: 10–20). Estimativa: ~550 palavras/página.
Status: **[já]** escrevível agora · **[repo]** exige conferir o que foi implementado · **[aval.]** depende da avaliação.
Fontes abreviadas: **DG** = `docs/DOCUMENTO-GERAL.md` · **DLN** = `docs/produto/decisoes-localizacao-notificacao-modelo.md` · **MD** = `docs/produto/modelo-de-dominio.md` · **PC** = `PROJECT-CONTEXT.md`.

## Título provisório
*Plataforma web de descoberta e agendamento de serviços: projeto e avaliação de um marketplace para beleza, bem-estar e saúde.*
Nome de marca entra só quando for definido.

## Pré-textuais
Capa · folha de rosto (natureza: Trabalho de Conclusão de Curso, Tecnologia em Análise e Desenvolvimento de Sistemas, Fatec Garça; orientadora Prof.ª Dr.ª Cláudia Maria Bernava Aguillar) · folha de aprovação · agradecimentos (opcional) · resumo ≤ 250 palavras + palavras-chave **[por último]** · listas de ilustrações, tabelas e siglas · sumário.

## 1 INTRODUÇÃO (~4 p)
Na norma da FATEC, metodologia e revisão bibliográfica ficam **dentro** da introdução.

| Seção | Orç. | Conteúdo | Fonte | Status |
|---|---|---|---|---|
| 1.1 Contextualização e problema | 0,75 p | descoberta fragmentada, confiança incerta, logística por telefone/WhatsApp, falta de controle; o custo do lado do prestador | DG §1; `02_Apresentacao_do_Tema.md` §1–2 (só o problema) | [já] |
| 1.2 Justificativa | 0,5 p | valor nos dois lados; a junção gestão + descoberta; pequeno negócio que opera só pelo celular | DG §2; `componentes-e-telas.md` §5 | [já] |
| 1.3 Objetivos | 0,4 p | geral: projetar, implementar e avaliar a plataforma. Específicos: (a) agendamento sem dupla reserva sob concorrência; (b) isolamento entre estabelecimentos; (c) conformidade LGPD na vertical de saúde; (d) interface acessível mobile-first; (e) avaliar usabilidade com consumidores e prestadores | DG §6, §8, §10, §11 | [já] |
| 1.4 Revisão bibliográfica | 1,5 p | agendamento online e plataformas de dois lados; multi-tenancy; controle de concorrência em banco; usabilidade e acessibilidade (Nielsen, SUS, WCAG); LGPD | referências a levantar, todas [VERIFICAR] | [já, esqueleto] |
| 1.5 Metodologia | 0,6 p | DSR com mapeamento etapa → capítulo; amostra (8–12 consumidores, 3–5 prestadores); roteiro idêntico escrito antes; TCLE; tratamento dos dados (códigos P01…); instrumentos técnicos (k6, Lighthouse, teste de concorrência, teste de arquitetura); CEP se exigido. **DSR e CEP pendentes da orientadora** | DG §11; PC §8 | [já] |
| 1.6 Hipóteses | 0,25 p | H1–H3 com limiares; hipóteses de mercado citadas e remetidas às limitações | DG §11.2 | [já] |

## 2 DESENVOLVIMENTO (~12 p)

| Seção | Orç. | Conteúdo | Fonte | Status |
|---|---|---|---|---|
| 2.1 Requisitos e escopo | 2 p | atores e glossário; matriz de permissões resumida (completa → Apêndice C); RFs principais; quadro RNF-01–06 (meta + medição); verticais e modalidade; **recorte de entrega** e o que ficou fora, com motivo | DG §3–5, §11.3, §12 | [já] |
| 2.2 Domínio e regras de agendamento | 2 p | 19 entidades em 9 módulos (visão por módulo; completo → Apêndice B); máquina de estados do `Appointment` (figura); estados que ocupam × liberam; slot calculado; snapshot de preço/duração/nome; feriados calculados; idade mínima | DG §5, §7; MD; DLN §1–4 | [já] |
| 2.3 Arquitetura e decisões | 3 p | stack; monólito modular com fronteira por teste de arquitetura; organização do backend; multi-tenancy por coluna (filtro global + teste 404; RLS como futuro); **dupla reserva: `EXCLUDE USING gist` × lock em Redis**; busca em etapas (`ST_DWithin` → texto → paginação → slots); geocodificação com confirmação do dono; portas (`IPaymentGateway`, `IGeocodingProvider`, `IIdentityVerificationProvider`); PWA e regras de empacotamento; quadro-resumo de ADRs. Outbox e notificações **como desenho** | DG §6, §8, §9; DLN §5; `claude/backend-architecture-prompt.md`; ADRs | [já + repo] |
| 2.4 Privacidade e LGPD | 1 p | agendamento em saúde como dado sensível (Art. 11); consentimento específico, versionado, que bloqueia; nada em página pública; log de acesso; CPF opcional e cifrado; consentimento do profissional para perfil completo; 18+ remove Art. 14; anonimização na exclusão; localização transitória; Argon2id, TLS | DG §10; DLN §2–3, §5.5 | [já + repo] |
| 2.5 Interface e design system | 2 p | eixo "precisão calma"; paleta AA (R3); status com dois canais; regra do tracejado; geometria de 44 px; tokens primitivo → semântico; três revisões sem refação de tela; telas principais (mobile e desktop); painel mobile como inclusão; tela de conflito HTTP 409 | `docs/design/*` (R3); Figma | [já + repo] |
| 2.6 Demonstração e avaliação | 2 p | ambiente e 30 estabelecimentos semeados; tabela de RNFs medidos; conclusão, tempo, erros, SUS, tempo de configuração do prestador; problemas encontrados e corrigidos | `docs/tcc/METRICS.md`, `USABILITY_TESTS.md`, `EVIDENCE_LOG.md` | [repo + aval.] |

## 3 CONSIDERAÇÕES FINAIS (~2 p) [aval.]
H1–H3 confirmadas ou refutadas · objetivos específicos atingidos ou não · limitações (DG §13: demonstração controlada, amostra pequena, hipóteses de mercado não testadas, verificação de identidade e de estabelecimento manuais, sem pagamento, primária vizinha de concorrentes, free tier) · trabalhos futuros (recorte do DG §12 + Pix/split, WhatsApp, novas verticais, publicação em lojas, cobrança por assento, verificação via base oficial).

## Pós-textuais
REFERÊNCIAS (NBR 6023).

APÊNDICES:
A – ADRs · B – Modelo de domínio · C – Matriz de permissões · D – Roteiro de tarefas · E – TCLE (modelo, sem assinaturas) · F – Questionário SUS e dados consolidados · G – Telas do sistema.

ANEXO (se houver): parecer do Comitê de Ética.
Se apêndices contarem nas 20 páginas, cortar primeiro o G.

## Divisão
| Pessoa | Seções |
|---|---|
| Arthur | 2.2, 2.3, 2.4, RNFs da 2.6 |
| Rafael | 2.5, condução da avaliação, resultados com usuários da 2.6 |
| Juntos | 1, 2.1, 3 — revisão cruzada de tudo |

Ordem de escrita: 1.1–1.3 → 1.5–1.6 → 2.1 → 2.2 → 2.5 → 2.3 → 2.4 → 1.4 → 2.6 → 3 → resumo.

## Referências-base a levantar [VERIFICAR todas antes de citar]
Hevner et al. (2004) e Peffers et al. (2007) — DSR · Brooke (1996) — SUS · Nielsen — heurísticas · Brasil, Lei nº 13.709/2018 — LGPD · W3C, WCAG 2.1 · documentação oficial do PostgreSQL (exclusion constraints, RLS) e do PostGIS (`ST_DWithin`).
