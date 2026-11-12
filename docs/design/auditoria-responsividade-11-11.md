# Auditoria de responsividade (C3, 11/11/2026)

Parte do código que já tinha o trabalho do Rafael (`refactor/*` até 11/11, mesclado nesta branch). Não refaz o que ele entregou: mede e corrige o que ainda estava errado.

## Método

- **Medição automática no navegador do app** (Playwright não está instalado no repositório, e instalar baixa um navegador inteiro: ficou de fora). Em 390, 768 e 1280 px, tema escuro, uma função percorreu cada rota e mediu: estouro horizontal (`scrollWidth` contra `innerWidth`, descontando contêiner com rolagem própria), controle visível com menos de 44 px, campo com fonte abaixo de 16 px e rota que cai em "Página não encontrada".
- Dados: pilha local com o seed (`dono.helena@…`), sessão de dono. Rotas só de consumidor autenticado (`/appointments`, revisão, pedido enviado) e `/admin` **não** foram percorridas nesta rodada.
- `env(safe-area-inset-*)` vale 0 no emulador: o que depende de área segura foi conferido **lendo o CSS**, não medindo.
- Não houve captura de tela versionada nem em `tmp/responsividade/` (sem Playwright). As capturas oficiais do TCC continuam sendo dos autores.

## Resultado

| Rota | 390 | 768 | 1280 | Observação |
|---|---|---|---|---|
| `/`, `/search`, `/businesses/:id`, escolher profissional, disponibilidade, `/profissional/:id`, `/para-estabelecimentos`, `/cadastrar-estabelecimento`, `/account`, `/context` | sem estouro | sem estouro | sem estouro | Nenhum controle abaixo de 44 px (os dois `input` de 1 px do cadastro são o rádio escondido do componente) |
| `/panel`, `/requests`, `/services`, `/services/new`, `/professionals`, `/members`, `/schedules`, `/photos`, `/settings`, `/reviews`, `/blocks`, `/profile`, `/more` | sem estouro | sem estouro | sem estouro | Chaves da jornada medem 20 px, mas a área de toque de 44 px é um `::after` (`switch`); o `input` de 1 px é o campo escondido |

Zero estouro horizontal e zero campo com fonte abaixo de 16 px nas 23 rotas medidas, nos três tamanhos.

## Defeitos dos prints de 11/11

| Defeito | Situação |
|---|---|
| Android, modal "Marcação de balcão": botão "Marcar" cortado pela barra do sistema | **Corrigido.** Cabeçalho e rodapé fixos, corpo com rolagem própria, rodapé com `padding-bottom` da área segura, `max-h` em `dvh`. Medido em 390×844: "Marcar" termina 24 px acima da borda |
| iPhone, "Revise seu pedido": aviso de erro cobre "Enviar pedido" | **Corrigido.** Com a barra fixa de ação (`ActionFooter`, marcada com `data-action-footer`), o aviso vai para o topo, abaixo de `safe-area-inset-top`. Medido: contêiner em `top: 16px` com a barra em 733 px |
| Android, "Jornada": barra inferior cobre "Cancelar" e "Salvar segunda" | **Corrigido no A4** (o editor rola até ficar acima da barra) |
| Regra geral: tela do painel com barra inferior precisa de `padding-bottom` = barra + área segura | **Já valia** (`PanelBottomNavigation`/layout); confirmado no fim de `/panel/schedules` |
| iPhone, endereço: estado de erro sem caminho adiante | **Reduzido pelo A2** (a escada agora desce até o município, então "não localizado" quase não ocorre). O estado de erro de rede ainda mostra só "Tentar de novo" e "Corrigir o endereço"; a tela segue com muito espaço vazio. **Não tratado** |
| iPhone, cadastro: banner "Ambiente de demonstração" sobrepõe o relógio | **Não tratado: o banner não existe nesta branch.** Está em `feat/demo-publica` (`components/demo-banner`), 4 commits à frente desta base. Corrigir `safe-area-inset-top` lá |

## Segunda passada (12/11): consumidor autenticado, tema claro e escuro

Medida no navegador do app, em 360 px, **logado como consumidor**, nos dois temas, pela largura do documento
(`scrollWidth` contra `clientWidth`) nas rotas `/`, `/appointments`, `/account`, `/context`, `/completar-cadastro`,
`/para-estabelecimentos`, `/cadastrar-estabelecimento`, `/convite` e `/search`.

- **Achado, causado por esta rodada:** o sino somou 44 px à barra superior do consumidor logado, e o menu da conta, sem
  `min-w-0`, não encolhia: a página passou a ter 419 px em 360 (`/`, `/appointments`, `/search`, `/para-estabelecimentos`).
  Corrigido em `layouts/public-layout` (`min-w-0` no menu da conta). Depois da correção, **nenhuma das rotas estoura**,
  nos dois temas.
- Alvo de toque: nenhum botão, link ou campo visível com menos de 44 px de altura nessas rotas (medido na primeira passada;
  `smallTargets` zero).
- **Teste que o pegaria:** não há. O estouro depende de largura real de layout e o projeto não roda navegador no CI.
  Fica a medição manual acima.

## Não coberto

- `/admin/estabelecimentos` (precisa da conta Admin) e o painel do dono com o sino, em 360 px (só por leitura do CSS: nome do
  estabelecimento com `min-w-0 flex-1`, sino e tema de 44 px).
- Comportamento real de safe-area em iPhone e Android.
- Capturas de tela (PNG), em qualquer largura: o painel do app ficou sem desenhar durante a sessão e o Playwright baixaria
  um navegador. A medição acima é por leitura do DOM, não por imagem.
- Capturas em 768 px das telas densas (agenda multi-profissional).
- Estado de erro de rede do endereço: segue só com "Tentar de novo" e "Corrigir o endereço".
