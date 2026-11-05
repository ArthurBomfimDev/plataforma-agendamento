# ADR-032 — Modelo de reputação: avaliações de agendamentos concluídos

- **Status:** Proposto
- **Data:** 2026-11-04
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Reputation (novo: `Review`, `RatingSummary`), Scheduling (contrato de leitura), People (contrato), Tenancy (leitura), frontend (busca, vitrine, página do profissional, "Meus agendamentos")
- **Substitui:** —
- **Substituído por:** —
- **Complementa:** ADR-004 (consumidor global), ADR-010 (fronteiras de módulo), ADR-031 (página do profissional)

> ⚠️ **Os textos mostrados ao consumidor (aviso de dado de saúde no formulário, regras de edição) e a política de
> moderação devem ser revisados pelo Arthur.** São rascunhos, sem revisão jurídica.

---

## Contexto

**Fato.** A busca e a vitrine ordenam por distância e preço. Não há como o consumidor saber se um estabelecimento ou um
profissional é bom antes de agendar. A página do profissional já tem um espaço de nota reservado e oculto.

**Fato.** Avaliação é texto livre público escrito por um consumidor sobre um estabelecimento que tem dono, equipe e, em
Saúde, dado sensível (LGPD Art. 11).

## Problema

Como mostrar reputação sem permitir avaliação falsa, sem expor o consumidor, sem revelar o que ele fez em Saúde e sem
perder contagem quando duas avaliações chegam juntas.

## Decisão

1. **Só avalia quem agendou.** Uma avaliação por agendamento **concluído**, pelo próprio consumidor, em até **30 dias**
   depois da conclusão. Índice único em `appointment_id` é a trava de verdade.
2. **Edição única.** Uma vez, em até **7 dias** depois de avaliar. Depois disso a avaliação é definitiva.
3. **Notas.** Atendimento de 1 a 5 (obrigatória); profissional de 1 a 5 (opcional); comentário opcional de até 500
   caracteres. Constraints `CHECK` no banco repetem a regra do domínio.
4. **Dono e equipe não avaliam o próprio estabelecimento.** Quem tem vínculo ativo recebe 403 `review.not_allowed`.
5. **Só em contexto de consumidor.** Token de painel de estabelecimento recebe 403 (`appointment.customer_context_required`),
   como no agendamento.
6. **Privacidade.** Nome público = primeiro nome + inicial do primeiro sobrenome ("Ana S."); o nome social vale mais que o
   nome da conta. Em **Saúde** a avaliação **não guarda nem mostra o serviço**, e o formulário avisa para não escrever dado
   de saúde no comentário. O comentário nunca entra em log.
7. **Agregado denormalizado em tabela própria.** `reputation.rating_summary` guarda, por alvo (estabelecimento ou
   profissional), contagem, soma e quantas notas de cada valor. É atualizado **na mesma transação** da avaliação.
   Não se escreve a média em `Business` nem em `Professional`: isso atravessaria a fronteira do módulo (ADR-010). Outros
   módulos leem pelo contrato `IReputationDirectory` (fatia 2).
8. **A média só aparece com 3 avaliações ou mais.** Antes disso o alvo é **"Novo"** (a contagem aparece; a média não).
9. **Concorrência.** `xmin` do PostgreSQL como token de concorrência do resumo. Duas avaliações simultâneas no mesmo alvo:
   a segunda perde a corrida e responde **503** `review.contention_try_again` para tentar de novo, em vez de perder uma
   contagem. Duas avaliações do mesmo agendamento: 409 `review.already_reviewed`.
10. **Limite de taxa.** 10 avaliações ou edições por hora por conta.
11. **Moderação.** O dono denuncia uma vez, e a avaliação segue pública até a decisão. O **Admin** oculta ou reexibe
    (`is_hidden`, quem decidiu, quando, motivo) ou mantém no ar. Avaliação oculta sai da lista e da média, na mesma
    transação. O dono **não** apaga nem edita avaliação.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Média escrita em `Business`/`Professional` | Quebra a fronteira de módulo (ADR-010) e mistura reputação com cadastro |
| Calcular a média na consulta (`AVG`) | Recalcula a cada busca; a ordenação por nota na busca vira varredura |
| Qualquer consumidor avalia | Abre porta para avaliação falsa e concorrência desleal |
| Resposta pública do dono | Fora do escopo desta fase; ver limitações |
| Consumidor apagar a própria avaliação | Permite avaliar, receber desconto e apagar; ver limitações |
| Redis ou lock para o contador | Rejeitado pelo projeto (CLAUDE.md §1); `xmin` resolve na escala atual |

## Consequências

- Uma tabela a mais por alvo, e duas escritas por avaliação (avaliação + resumo) na mesma transação.
- O Scheduling expõe só o que a avaliação precisa (`IAppointmentReviewLookup`); Reputation não conhece a entidade
  `Appointment`.
- **Média de profissional** conta só as avaliações em que o consumidor deu nota a ele.
- Aceitar 30 dias de janela significa que um estabelecimento novo leva semanas até mostrar média.

## Limitações registradas (não são bugs)

- **O dono não responde** a uma avaliação. Resposta pública exige moderação própria e foi cortada desta fase.
- **O consumidor não apaga** a avaliação. Pedido de remoção vai pelo suporte e, com a moderação, o Admin pode ocultar.
- Sem filtro de palavras: o comentário é revisado só quando denunciado.
- Avaliação não pondera por recência; uma nota de dois anos atrás pesa como a de ontem.

## Pendente de decisão do Arthur

1. Aprovar a janela de 30 dias e a edição única de 7 dias.
2. Revisar o texto do aviso de dado de saúde.
3. Definir se Saúde mostra a avaliação com o nome do profissional.
