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

- **Regra do documento (CPF ou CNPJ por categoria) e modo "Atendo na minha casa": em aberto** (versões A e B). O passo do
  documento fica atrás de um ponto de extensão com o texto "em definição".
- Fora do escopo: consulta de CNPJ na Receita, integração com conselhos profissionais, upload de documento, pagamento
  e plano, edição de nome e categoria depois de ativo. A situação cadastral e o registro no conselho são conferidos à
  mão pelo Admin.
- Beleza publica sem conferência humana; o freio é o limite de 3 por conta, as denúncias e a suspensão (ADR-028).

## Equipe, convites e papéis (Fase 4)

- **Sem tela do dono para convidar.** O convite, o reenvio, a revogação e a lista de pendentes existem na API (ADR-029)
  e têm testes, mas a tela "Convidar" em Profissionais **não foi feita**. Quem convida hoje usa a API.
- **Sem tela de bloqueios para o atendente** e **sem tela para o profissional registrar folgas** ou editar a própria bio
  e foto. A API já aceita (ADR-030: `schedule-exceptions` com escopo e `professionals/me`). A tela de Jornadas e bloqueios
  continua só do dono.
- O painel do atendente não pode depender de `GET /api/businesses/current` (403); ele usa o nome do `GET /api/users/me`.
- Quem volta à equipe (`Rejoin`) e tinha o perfil desativado precisa ser reativado pelo dono; o aceite não reativa.
- Aceite simultâneo do mesmo link por duas requisições: protegido só pelo índice único do vínculo.
- O termo do profissional é **rascunho, sem revisão jurídica**.

## Verificação

- Tudo escrito em 04/11 sem Docker e sem navegador está em `docs/verificacao-pendente.md` com o que ainda não tem prova.
