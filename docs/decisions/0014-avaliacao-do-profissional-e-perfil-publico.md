# ADR-014 — Avaliação do profissional e perfil público dividido

- **Status:** Proposto
- **Data:** 2026-10-26
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Reputation, People
- **Substitui:** —
- **Substituído por:** —
- **Complementa:** ADR-004 (invariante 4)

---

## Contexto

**Fato.** Decisão de 22/09 (`docs/produto/decisoes-localizacao-notificacao-modelo.md` §3), que reabre as
decisões de produto 2.10 (avaliação só do estabelecimento) e 2.7 (perfil do profissional público com
consentimento). Ainda sem ADR.

**Fato.** A ADR-004, invariante 4, diz que perfil público de profissional exige `PublicProfileConsentAt`, e
proíbe expor perfil sem consentimento — sem distinguir o nome do restante do perfil.

**Fato.** O consumidor precisa saber quem vai atendê-lo, e o nome do profissional já aparece no próprio
agendamento.

**Fato, motivo jurídico registrado em 22/09.** Obrigar o funcionário a publicar a própria imagem como
condição de trabalho produz consentimento inválido pela LGPD: consentimento dado em relação de emprego não
é livre.

**Fato, estado do código em 26/10.** O perfil dividido está implementado: a vitrine pública devolve sempre
o nome e só devolve especialidade e bio quando `IsPubliclyVisible`, que exige `PublicProfileConsentAt`. O
consentimento só pode ser dado pelo próprio profissional, pela conta dele (`SetPublicProfileConsentCommand`).
**A avaliação não está implementada**: o módulo Reputation não tem código e está fora do recorte de entrega.

## Problema

Quanto do perfil do profissional pode ser público sem consentimento, e o profissional deve ser avaliado
separadamente do estabelecimento?

## Alternativas consideradas

### A — Perfil inteiro só com consentimento, avaliação só do estabelecimento (decisões 2.7 e 2.10)

**A favor:** a regra mais simples; nenhum campo novo.
**Contra:** sem consentimento, a escolha de profissional mostraria opções sem nome — inutilizável. E a nota
única do estabelecimento esconde a diferença entre profissionais, que é o que o consumidor de beleza
procura.

### B — Nome sempre público; perfil completo com consentimento; nota opcional do profissional na mesma avaliação

**A favor:** o nome já é público no agendamento; foto, bio e certificações, que são imagem pessoal, ficam
sob consentimento livre. A nota do profissional reaproveita a avaliação do agendamento, sem multiplicar
avaliações.
**Contra:** dois campos desnormalizados a manter no `Professional`.

### C — Avaliação por par serviço × profissional

**A favor:** a informação mais precisa.
**Contra:** escassez — quase todo par teria zero ou uma avaliação, e "5,0 ★ (1)" lê como inventado.

## Decisão

Adotamos **B**.

- `Professional.DisplayName` é **sempre público**.
- `IsPubliclyVisible` significa **perfil completo visível** (foto, bio, experiência, certificações) e exige
  `PublicProfileConsentAt`, registrado pelo próprio profissional.
- `Review` ganha `ProfessionalRating` opcional; continua **uma avaliação por agendamento**.
  `Professional` ganha `AverageRating` e `ReviewCount` desnormalizados.
- Avaliação por par serviço × profissional fica como trabalho futuro.

A invariante 4 da ADR-004 passa a ser lida assim: **o perfil completo** exige consentimento; o nome, não.

## Consequências

### O que fica mais fácil

- A escolha de profissional funciona mesmo sem nenhum consentimento dado.
- O capítulo de conformidade ganha o argumento do consentimento livre em relação de emprego.

### O que fica mais difícil

- O dono não consegue liberar o perfil de um funcionário: só o próprio funcionário, pela conta dele. Quem
  não tem conta aparece só com o nome.
- Quando a avaliação entrar, as médias desnormalizadas precisam ser atualizadas na mesma transação da
  avaliação.

### O que passa a ser proibido

- Expor foto, bio, experiência ou certificações sem `PublicProfileConsentAt`.
- Registrar consentimento em nome de outra pessoa.
- Avaliação por par serviço × profissional antes de haver volume que a sustente.

## Como saber que erramos

- Se profissionais pedirem para ocultar também o nome — a premissa de que o nome já é público no
  agendamento não bastou.
- Se, quando a avaliação existir, a nota do profissional quase nunca for preenchida.

## Referências

- `docs/produto/decisoes-localizacao-notificacao-modelo.md` §3
- ADR-004 — invariante 4
- `backend/src/Core/Booking.Application/Module/People/` — `SetPublicProfileConsentCommand`, `PeopleConverter.ToPublic`
