# ADR-012 — Idade mínima de 18 anos e agendamento para terceiro

- **Status:** Proposto
- **Data:** 2026-10-26
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** People, Scheduling, Compliance
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

**Fato.** A decisão foi tomada em 22/09 (`docs/produto/decisoes-localizacao-notificacao-modelo.md` §2.1) e
ainda não tinha ADR.

**Fato.** A LGPD trata dado de criança e adolescente em artigo próprio (Art. 14), com exigência de
consentimento de responsável. O projeto tem duas pessoas, prazo de código até a segunda semana de
novembro, e não tem como construir nem testar uma máquina de consentimento verificável de responsável.

**Fato.** O caso real de menor nos serviços atendidos — o corte de cabelo do filho, a consulta — já é
marcado por um adulto.

**Fato.** O código implementa a regra: `Customer.MinimumAge = 18`, verificado no cadastro do perfil de
consumidor (`customer.underage`), e o pedido de agendamento aceita `AttendeeName`, gravado em
`Appointment.WalkInName`, o mesmo campo da marcação de balcão.

⚠️ **Não somos advogados.** O recorte etário precisa ser confirmado com a orientadora, junto da consulta
sobre o Comitê de Ética (pendência F).

## Problema

Como atender o agendamento de menores sem tratar dado de menores e sem construir consentimento de
responsável?

## Alternativas consideradas

### A — Cadastro aberto a qualquer idade, com consentimento de responsável para menores

**A favor:** o adolescente agenda sozinho.
**Contra:** traz o Art. 14 para o escopo; exige verificar quem é o responsável, o que não cabe no prazo e
não teria como ser testado de forma honesta na demonstração.

### B — Cadastro só para maiores, com agendamento para outra pessoa

**A favor:** tira o Art. 14 do escopo com uma frase verdadeira; atende o caso real; reaproveita
`WalkInName`/`WalkInPhone`, sem coluna nova.
**Contra:** o adolescente que quer agendar no próprio celular não consegue.

## Decisão

Adotamos **B**. O cadastro de consumidor exige **18 anos completos**, calculados a partir de `BirthDate`. O
agendamento para outra pessoa — inclusive menor — é feito pela conta de um adulto, com o nome de quem será
atendido gravado no próprio agendamento (`AttendeeName` → `WalkInName`).

## Consequências

### O que fica mais fácil

- O capítulo de conformidade afirma que a plataforma não trata dados de menores.
- O modelo não ganha entidade nem coluna: a invariante reaproveita os campos de balcão.

### O que fica mais difícil

- Limitação declarada no TCC: o adolescente não agenda sozinho.
- A data de nascimento passa a ser coletada de todo consumidor, só para verificar a idade.

### O que passa a ser proibido

- Cadastro de consumidor com menos de 18 anos.
- Campo de dado do atendido além do nome e, se houver, do telefone.

## Premissa não verificada

**A declaração de idade é autodeclarada.** Não há verificação documental (ver ADR-013). A regra reduz o
escopo jurídico, mas não impede que um menor declare uma data falsa. Se a orientadora ou o Comitê de Ética
entender que a autodeclaração não basta, esta ADR precisa ser revista.

## Como saber que erramos

- Se o recorte etário for recusado pela orientadora ou pelo Comitê de Ética.
- Se, na demonstração, o fluxo de agendamento para terceiro não for encontrado pelos participantes.

## Referências

- `docs/produto/decisoes-localizacao-notificacao-modelo.md` §2.1, §2.4
- `backend/src/Core/Booking.Domain/Entity/Module/People/Customer.cs` — `MinimumAge`
- `PROJECT-CONTEXT.md` §5 (Identidade), §11 (pendência F)
