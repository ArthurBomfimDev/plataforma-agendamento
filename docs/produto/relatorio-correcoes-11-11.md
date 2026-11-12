# Relatório das correções finais do Vagoo (11/11/2026)

Branch `claude/vagoo-final-fixes-995bf6`. Sem PR (GitHub bloqueado por cobrança): a verificação é local, com Docker. A nota para o TCC está em `docs/tcc/NOTA-ATUALIZACAO-11-11.md`.

## Passo 0: a base

A branch nasceu igual à `main` de 13/10, 274 commits atrás de `feat/integracao-final`. Foi refeita sobre `feat/integracao-final` (as refatorações do Rafael de 29/10 a 07/11 já estavam nela) e recebeu a mescla dos 3 commits do Rafael de 10 e 11/11 (`origin/refactor/verification`: contrato e faixa de verificação, avisos do painel). A mescla quebrou um teste de política de papéis (consulta nova sem classificação): classificada como só-dono (`3dc928f`). Mais tarde entrou `feat/demo-publica` (banner, Tailscale Funnel, PWA, seed novo), também sem conflito de texto.

## Commits desta rodada

| Item | Commit |
|---|---|
| Passo 0, política de papéis | `3dc928f` |
| A1, recusa de horário diz o motivo | `ad73b82` |
| A2, endereço desce até o município | `87bc956` |
| A3, foto do profissional em todo lugar | `735f708` |
| A4, `TimeField` | `e423421` |
| B1, máscaras | `35e7a22` |
| B2, vitrine de 3 fotos (com migration) | `24353ba` |
| B3, seed com imagens (parcial) | `c29a3bd`, `4d6f88e` |
| C1, auditoria de notificações e tela sem promessa falsa | `e037cb1` |
| C3, camadas fixas (parcial) | `1d59b02` |
| Mescla de `feat/demo-publica` | `ed92004` |
| D, nota do TCC e este relatório | último commit |

Totais contra `feat/integracao-final`, já com as mesclas do Rafael e da demo-publica: 182 arquivos, 9.334 inserções, 669 remoções. O que é desta rodada (sem Rafael nem demo-publica) está nos commits da tabela.

## Causa raiz dos bugs

**A1.** `SlotGuard` lançava `appointment.slot_no_longer_available` (409) para qualquer horário fora da lista do calculador. Nos casos de 11/11 o horário **não** estava ocupado (confirmado no banco local: só havia o agendamento das 12:00 e o das 16:00, sem buffer): as 11:45 online caíam na antecedência mínima (09:45 + 2 h; a lista na tela era mais velha que o clique) e as 13:00 do balcão caíam no intervalo de almoço da jornada (09–13 e 14:30–19). O balcão aceita qualquer hora digitada, então a agenda aparecia livre na tela. As hipóteses 2 e 3 do prompt (buffer assimétrico, fuso, mapeamento largo da exceção) foram refutadas pelos dados.

**A2.** O Nominatim só conhece o município de Duartina (rua, bairro e CEP voltam vazios), enquanto ViaCEP e BrasilAPI resolvem a rua. A escada de consultas do cadastro tinha três consultas, todas com a rua, e terminava em "não foi possível localizar" sem saída.

**A3.** A foto só aparecia onde o profissional é o assunto da tela. Onde ele é citado (serviços ligados a ele, agenda, jornadas, bloqueios), o avatar era só de iniciais, embora o DTO já trouxesse `photo`. Havia três implementações de avatar.

**A4.** Não era estouro horizontal (medido em 360 e 390 px: não há). Era o seletor nativo do `<input type="time">`, cujo botão "Definir" fica fora da tela no Chrome do Android e não se controla por CSS.

## Divergências código × documentação

- O prompt supunha o trabalho do Rafael já na branch; não estava.
- O prompt pede passo de 15 minutos na jornada; a tela usava 5.
- O prompt pede `inputMode` numérico nos campos de documento; o do CNPJ ficou `text` porque o CNPJ alfanumérico (desde 31/07/2026) tem letras.
- O prompt pede `lib/masks`; o repositório usa `utils/`.
- O prompt supunha que `PENDENTE` do mapa e do CEP de reserva cabiam no A2; precisam de decisão (CSP do site; segunda URL base de provedor).
- A tela "Pedido enviado" mostrava lembrete "24 h e 3 h" sem envio por trás (`MOCK_REMINDER_HOURS`).
- A decisão de 11/11 de lembretes de 24 h e 1 h foi cumprida depois da auditoria (C1): primeiro a regra de corte os deixou de fora, depois o Arthur pediu e foram feitos.
- O banner de demonstração e o Funnel não estavam na base (`feat/demo-publica`); agora estão.
- A `.gitignore` de `scripts/seed-assets/*/` impede versionar as fotos de banco de imagem que o B3 pede.

## Verificação (D1)

| O que | Resultado |
|---|---|
| Backend | 28 testes de arquitetura, 482 de unidade, 196 de integração: passam (com os lembretes do C1). `dotnet format` limpo |
| Frontend | 787 testes (97 arquivos), `typecheck`, lint e Prettier limpos |
| Scripts | `bun test scripts`: 21 passam |
| Suíte de concorrência (grupo A, RNF-03) | Passa: nenhuma dupla reserva |
| `docker compose up` do zero | Pilha derrubada com volumes (`down -v`) e subida de novo, em projeto isolado (`vagoo-fixes`, portas 18080/18081/15433/18025). Migrations aplicadas, incluindo `AddBusinessGalleryPhotos` |
| Seed completo (`--historico`) | Roda até o fim, 30 estabelecimentos mais o que fica em análise |
| Roteiro dos fluxos pela API, na pilha nova | Agendamento online no primeiro horário livre: 201. Mesmo horário de novo: 409 `slot_no_longer_available` com `alternatives`. 02:00 local, online e balcão: 422 `outside_work_hours`. Balcão em horário ocupado: 409. Balcão no último horário livre: 201 |
| Duartina, rede real, pela API | CEP 17471-318: 200, "Avenida Doutor Gil Borges, Duartina-SP". Geocodificação da rua: 200, **0 itens**. Do município: 200, 2 itens, precisão `City`. CEP inexistente (00000-000, 12345-000): 404 |
| Navegador do app, 360/390/768/1280 px | 23 rotas sem estouro horizontal; `TimeField`, vitrine, painel de fotos e modal de balcão conferidos |

## O que não rodou ou não foi verificado

- **Android e iPhone reais.** Nada de seletor nativo, safe-area, teclado numérico ou barra do sistema foi visto em aparelho. `safe-area-inset` vale 0 no emulador; conferi o CSS por leitura.
- **URL pública do Tailscale Funnel.** O Funnel é do ambiente do Arthur; as fotos não foram conferidas por ele.
- **Cadastro de estabelecimento em Duartina pela tela, com rede real.** Verifiquei os provedores e a API, e a escada por teste; a tela inteira não.
- **Playwright e capturas.** Não instalado (baixa um navegador). Sem capturas em `tmp/responsividade/`.
- **Rotas de consumidor autenticado, `/admin` e `/convite`**, tema claro do inventário todo.
- **Alternativas do 409 destacadas na tela.** Não implementado.
- **Se o Google Agenda respeita o alarme do `.ics`.** Não testado.

## Pendências, com o motivo

| Item | Motivo |
|---|---|
| B3: baixar os 45 arquivos e preencher `CREDITS.md` | Os bancos de imagem bloqueiam o ambiente (Unsplash e Pixabay pedem login ou chave; Pexels bloqueia robô). Lista e verificador prontos em `scripts/seed-assets/` |
| B3: versionar as fotos | `scripts/seed-assets/*/` está no `.gitignore` por decisão de 11/11; o prompt pede o contrário |
| B4: logo certa | O arquivo da logo (WhatsApp) não está em `docs/design/marca/`, em nenhum checkout nem no histórico. Já existe `scripts/pwa-icons.ts` (demo-publica): trocar `vagoo_icone_escuro.png` e rodar. Falta o componente `Logo` único e o inventário |
| C1: lista in-app (sino) | **Implementada depois**, a pedido do Arthur (backend `8641e2d`, mais o frontend). Os lembretes por e-mail 24 h e 1 h também, com teto de 400 e-mails em 24 h que só segura lembretes (ver `auditoria-notificacoes-11-11.md`). Retenção feita em 12/11: o aviso lido sai com 30 dias e o não lido com 90, por um worker diário |
| C2: Tauri | Dispensado pelo Arthur. Nada foi medido ou escrito |
| C3: estado de erro de rede do endereço, banner no iPhone, rotas de consumidor, capturas | Ver "não rodou"; o banner aplica a safe-area, falta o aparelho |
| A1: destacar alternativas do 409 | Mudança na tela de horários, fora desta rodada. Mantém a limitação da seção 3.2 |
| ~~A2: mapa para arrastar o pino e CEP de reserva em outro provedor~~ | **Feitos em 12/11.** CEP: BrasilAPI e ViaCEP se cobrem (`1bb8312`). Mapa: Leaflet no cadastro, pino arrastável e botões de 10 m (`1396a15`); abre a CSP do site para `https://tile.openstreetmap.org` (**revisão humana: infraestrutura**). O mapa **não foi visto funcionando na tela**: só typecheck, lint, testes dos cálculos e a conferência de que o ladrilho do OpenStreetMap carrega sob a CSP nova |
| ~~Jornada que fecha à meia-noite~~ | **Feita em 12/11.** Fim 00:00 vale como fim do dia (`4c9382d`); migration `AllowWorkScheduleClosingAtMidnight` em commit próprio (`ec4d9f5`, **não aplicada** em banco compartilhado; revisão humana). Teste de integração com o banco real passa |

## Revisão humana obrigatória (CLAUDE.md §4)

- **Migrations** `AddBusinessGalleryPhotos` (duas colunas nulas em `tenancy.business`), `AddAppointmentReminderMarks` (duas colunas nulas em `scheduling.appointment`), `AddNotification` (tabela nova `notifications.notification`, dois índices) e `AllowWorkScheduleClosingAtMidnight` (troca a constraint `ck_work_schedule_time`; `Down` falha se já houver jornada que fecha à meia-noite).
- **Infraestrutura / CSP:** `frontend/nginx.conf` passou a aceitar imagens de `https://tile.openstreetmap.org` (mapa do cadastro). É a única origem externa; o navegador de quem cadastra consulta o OpenStreetMap.
- **Autorização:** `GetCurrentVerificationQuery` classificada como só-dono; `BusinessGalleryCommand` só-dono (`RolePolicyTests` cobre os dois); novos códigos de erro 422 de horário.
- **Multi-tenancy:** a galeria passa por `CurrentBusinessLoader.LoadForOwnerAsync`, como logotipo e capa; teste de integração com outro papel (403).
- Nenhum segredo foi commitado. O `.env` local (gerado com segredos aleatórios, ignorado pelo git) fica só na máquina.

## Ambiente que deixei de pé

`docker compose -p vagoo-fixes ...` (4 contêineres) com o seed completo. Para parar: `docker compose -p vagoo-fixes down` (com `-v` apaga o banco). Os contêineres `booking-*` de outro worktree não foram tocados.
