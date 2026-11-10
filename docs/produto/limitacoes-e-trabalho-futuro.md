# Limitações conhecidas e trabalho futuro

Registro vivo do que o recorte de entrega **não** faz de propósito. Cada item diz o que falta, por que ficou de fora e o
que o resolveria. Nada aqui é defeito escondido: é limite declarado (relevante para o capítulo de limitações do TCC).

> Atualizado em 2026-11-04.

## Agenda do consumidor

### `SEQUENCE` do cancelamento fixo em 1 (aceito pelo Arthur em 04/11)

O `.ics` de confirmação sai com `SEQUENCE:0` e o de cancelamento com `SEQUENCE:1` e o mesmo `UID`
(`IcsCalendar.Cancel`). Não há contador por agendamento.

- **Por que serve hoje:** o agendamento só muda de estado uma vez depois de confirmado (confirma, depois cancela). Não há
  remarcação, então nenhum evento passa de duas versões.
- **O que quebra se houver remarcação:** a agenda do consumidor ignora um evento com `SEQUENCE` igual ou menor ao que ela
  já tem. Duas mudanças seguidas com o mesmo número não atualizariam o evento.
- **Solução:** contador de versão no agendamento (ver "Remarcação", versão completa).

### Remarcação (trabalho futuro)

Hoje não existe "remarcar": cancela-se e pede-se outro horário. Duas versões possíveis:

| Versão | Como funciona | Custo | Efeito na agenda |
|---|---|---|---|
| **Leve** | Remarcar = **novo pedido ligado ao antigo**. Quando o novo for confirmado, o antigo é cancelado sozinho. | Baixo: um vínculo `rescheduled_from` no agendamento e uma regra de cancelamento. Passa pela aprovação normal. | Dois eventos: o novo (`UID` novo) e o antigo, removido pelo `.ics` de cancelamento já existente. |
| **Completa** | O **mesmo agendamento muda de horário**: contador de versão, **nova aprovação** do estabelecimento e notificações dos dois lados. | Alto: máquina de estados nova (pendente de remarcação), conflito com o horário antigo enquanto aguarda, e-mails novos. | Mesmo `UID` com `SEQUENCE` maior a cada versão (substitui o `SEQUENCE` fixo acima). |

Recomendação: começar pela leve, que reaproveita o fluxo de pedido, a exclusão por `EXCLUDE USING gist` e o cancelamento
com `.ics`. A completa só se a banca ou os testes pedirem.

## Busca

- Radical simples do português (ADR-024): "cortando" não casa com "corte"; radical curto traz ruído (`BARB` casa
  "Studio Bárbara"). Sem lematização completa.
- Comparação em memória sobre até 500 candidatos; uma cidade grande exigiria levar o texto para o banco.

## Cadastro do estabelecimento

- **Regra do documento: Versão B (04/11, ADR-028).** Toda categoria aceita CPF ou CNPJ. "Sou MEI" é declarado pelo dono e a
  plataforma não confere.
- Um documento não se repete entre estabelecimentos (índice único): quem cadastra com CPF tem **um** estabelecimento por CPF,
  embora a conta aceite até 3.
- Fora do escopo: consulta de CNPJ na Receita, integração com conselhos profissionais, upload de documento, pagamento
  e plano, edição de nome e categoria depois de ativo. A situação cadastral e o registro no conselho são conferidos à
  mão pelo Admin.
- Beleza publica sem conferência humana; o freio é o limite de 3 por conta, as denúncias e a suspensão (ADR-028).

## Equipe, convites e papéis (Fase 4)

- As telas de **Convidar** (em Profissionais), **Folgas e bloqueios** (atendente e profissional) e **Meu perfil**
  (profissional) existem, mas **nenhuma foi vista num navegador** (`docs/verificacao-pendente.md`).
- O **registro profissional** (Saúde) é gravado pelo dono (Editar) e pelo profissional (Meu perfil), mas **ainda não
  aparece** na vitrine do consumidor: a exibição vem com a página pública do profissional.
- A jornada semanal continua só do dono: atendente e profissional bloqueiam e folgam, mas não mudam a jornada.
- O painel do atendente não pode depender de `GET /api/businesses/current` (403); ele usa o nome do `GET /api/users/me`.
  Não há tela de **Sair do estabelecimento** para quem tem conta.
- Quem volta à equipe (`Rejoin`) e tinha o perfil desativado precisa ser reativado pelo dono; o aceite não reativa.
- Aceite simultâneo do mesmo link por duas requisições: protegido só pelo índice único do vínculo.
- O termo do profissional é **rascunho, sem revisão jurídica**.
- **Sair do estabelecimento** está em Meu perfil (profissional) e em "Mais" (profissional e atendente, só no celular). O
  atendente no desktop não tem entrada para ela: o menu lateral não tem "Mais".
- O pedido de remoção de perfil **não desativa nada sozinho** e o Admin só o encerra com anotação; quem desativa é o dono.
  Não há aviso de volta a quem pediu (o contato é opcional e só vai ao dono e ao Admin).
- A página do profissional mostra os horários de hoje e amanhã do **primeiro serviço** dele; a escolha de verdade acontece
  no fluxo de agendamento.

## Endereço do cadastro: achar o ponto (medição de 10/11)

O dono informa o endereço, o sistema procura o ponto no provedor de geocodificação, o dono vê e confirma. O link "Ver no
mapa" (outra aba) e a confirmação do dono continuam; não há mapa com pino.

**Variante adotada em 10/11:** as consultas passaram de "com o bairro, depois só a rua" para **"sem o bairro, com o bairro,
só a rua"**, e a busca só para cedo quando acha o ponto exato ou a rua. Se achar só o bairro ou a cidade, tenta as próximas e
fica com o resultado mais preciso de todos, então uma consulta mais frouxa nunca esconde uma melhor.

Medido com o código real de cada versão, contra o provedor de verdade, pela API da pilha isolada, nos **mesmos cinco
endereços de Garça** de 05/11 (CEP e número de fontes públicas: o regulamento da Fatec e o diretório escol.as):

| Endereço | 05/11, antes | 10/11, antes | 10/11, **depois** |
|---|---|---|---|
| Fatec: Av. Presidente Vargas, 2331 | só o bairro | **no número** | **no número** |
| Etec: 277 (a rua do CEP, Rua Belém) | só o bairro | só o bairro | **no número** (Rua Belém, 277) |
| EMEI Victor Hugo: Rua Vitória, 730 | bairro **errado** (Labienópolis) | o mesmo | o mesmo |
| Creche Andreia: Rua Ludovico Álvaro Ferrari, 170 | não achou | não achou | não achou |
| CMEI Patronato: Av. Gabriela, 1394 | não achou | não achou | não achou |
| **No número** | **0 de 5** | **1 de 5** | **2 de 5** |

- **Só adotei porque não piorou nenhum caso:** quatro ficaram iguais e um melhorou.
- **A linha de base mudou sozinha.** O algoritmo antigo foi de 0 de 5 (05/11) para 1 de 5 (10/11), sem nenhuma mudança de
  código: a resposta do provedor varia de um dia para o outro. Por isso a comparação válida é a do mesmo dia (10/11, antes ×
  depois), não a de 05/11.
- **Custo:** até 3 consultas ao provedor por endereço, em vez de 2, quando só acha o bairro. O limite da API é de 30 por minuto.
- **Três dos cinco continuam sem o ponto exato.** O provedor conhece pouco de Garça. A saída é a confirmação do dono, vendo o
  ponto no mapa; o "Ver no mapa" mostra o que o provedor achou, e o dono corrige o endereço se estiver longe.
- Na Etec, a fonte pública diz "Doutor Martinho Funchal de Barro", mas o CEP resolve para a Rua Belém: o endereço de origem é
  duvidoso, e a medição usou a rua do CEP.
- **Testes existentes alterados, e por quê:** `addressQueries` ("monta a busca completa e a de reserva") e `locateAddress`
  ("tenta a segunda busca quando a primeira não acha nada") fixavam a ordem antiga das consultas. A ordem mudou de propósito,
  pela medição acima; os dois foram reescritos para a ordem nova, e entraram quatro testes para parar no preciso, continuar
  quando só acha o bairro, nunca perder um resultado melhor e não repetir consulta sem bairro.
- "Buscar CEP" agora valida o CEP antes de consultar, mostra "Buscando…", diz o que preencheu e leva o cursor ao campo que
  falta (o número, que o CEP nunca traz). Rua e número continuam obrigatórios, com mensagem por campo.

## Cadastro sem conta prévia (ADR-034, 10/11)

- Quem cria a conta pelo assistente de estabelecimento fica **sem perfil de consumidor** (data de nascimento). Se tentar agendar,
  a API responde `customer.profile_required` e **não há tela para completar o perfil**: é a mesma limitação de quem entra por
  outro aparelho. Trabalho futuro: uma tela "Complete seu cadastro de consumidor", em Minha conta.
- O aceite dos termos de uso no passo "Sua conta" é uma caixa obrigatória na tela, **não gravada pela API** (como no cadastro
  comum, que só mostra o texto). O aceite gravado é o dos termos do estabelecimento, no fim do assistente.
- O destino depois da confirmação do e-mail fica guardado no aparelho (48 horas, amarrado ao e-mail). Confirmar em outro
  navegador perde o destino: a pessoa entra e cai na Home.
- O link "Para estabelecimentos" está no cabeçalho do **desktop**. No celular a barra já tem logotipo, tema, "Entrar" e "Criar
  conta"; quem não tem sessão chega pelo cartão "Tem um negócio?" da Home.

## Cancelamento

- O texto de "Revise seu pedido" diz "Cancelamento gratuito até N h antes. Depois disso, fale com o estabelecimento.", com o
  prazo do próprio estabelecimento. **Não existe pedido de cancelamento fora do prazo nem aprovação no sistema**; o
  cancelamento fora do prazo é recusado (`appointment.cannot_cancel_inside_window`) e a mensagem manda falar com o
  estabelecimento.
- A resposta pública do estabelecimento **não traz telefone nem e-mail**; por isso a tela mostra só o texto. Expor um contato
  é decisão de produto e de LGPD (o dono precisaria cadastrá-lo e consentir com a exibição).

## Limites de taxa

### Defeito encontrado e corrigido: limites "por conta" caíam no IP (04/11)

- **Sintoma.** O job `backend / build-test` ficou vermelho do #41 em diante: 100 de 138 testes de integração falhavam, 98 deles
  com `POST /api/businesses → 429`.
- **Causa.** Em `Program.cs`, `UseRateLimiter()` rodava **antes** de `UseAuthentication()`. Na hora do limitador `context.User`
  ainda era anônimo, então `FindFirst("sub")` vinha nulo e toda política "por conta" caía no IP. Como todo pedido de teste vem do
  mesmo IP, o limite de 5 criações por hora, novo no #41, estourou para a suíte inteira.
- **Efeito em produção.** Os limites de criar estabelecimento, enviar imagem, convidar, avaliar e trocar a senha eram por IP, não
  por conta. Atrás do túnel, se o IP real não chegasse, viravam limites **globais**: uma pessoa bloquearia todas. Quem tem vários
  IPs, por outro lado, escapava do limite da conta.
- **Correção.** `UseRateLimiter()` depois de `UseAuthentication()` e `UseAuthorization()`. As políticas por IP (`auth`, `geo`,
  `report`, `invitation-link`) não mudam: leem o IP, e `UseForwardedHeaders()` continua antes de tudo.
- **Prova.** `RateLimitTests.L1` falhou antes da correção e passa depois: duas contas no mesmo IP têm contadores separados, e a
  mesma conta recebe 429 ao passar do limite. `L2` prova que trocar de conta não abre outro contador numa política por IP.
- **Consequência da nova ordem.** Pedido sem token numa rota protegida recebe 401 antes do limitador e não conta para o limite.
- **Lição.** Só o teste de integração enxergava o defeito: teste unitário não passa pelo pipeline do ASP.NET. O erro atravessou
  do #41 ao #53 sem ser notado porque aquelas fatias foram escritas sem Docker e o CI vermelho não foi lido.

## Verificação

- Tudo escrito em 04/11 sem Docker e sem navegador está em `docs/verificacao-pendente.md` com o que ainda não tem prova.
