# ADR-031 — Perfil público do profissional sempre ligado, com declaração do dono

- **Status:** Proposto
- **Data:** 2026-11-04
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** People (`Professional`, comandos e rotas do painel e da vitrine), Notifications (nenhum), frontend (equipe e fotos)
- **Substitui:** a regra do consentimento por profissional das decisões de modelo de 22/09 §3 e do ADR-004 (invariante 4), no que diz respeito ao perfil do profissional
- **Substituído por:** —
- **Complementa:** ADR-023 (imagens), ADR-029 (convite de equipe)

> ⚠️ **A redação jurídica desta decisão deve ser revisada pelo Arthur.** O texto da declaração e o do termo do profissional
> são rascunhos, sem revisão de advogado.

---

## Contexto

**Fato.** Até aqui, o perfil completo do profissional (especialidade, bio, foto) só aparecia na vitrine com o **consentimento
registrado do próprio profissional**, dado pela conta dele. O dono não podia dar o consentimento por ele. Foi desenhado assim
porque consentimento imposto como condição de trabalho não seria livre.

**Fato.** O resultado prático foi um perfil quase sempre "só o nome": quem não tem conta (o caminho principal, ADR-029) nunca
consentia, então a vitrine ficava sem foto nem apresentação, o que enfraquece a página do profissional e as avaliações.

**Decisão do produto (Arthur, 04/11).** O perfil do profissional é **sempre público** enquanto ele está ativo. A opção de
perfil privado acaba. A foto continua opcional (sem foto, avatar com as iniciais).

## Problema

Como tornar o perfil sempre público sem expor dados de uma pessoa que não concordou, e sem depender de um consentimento que
quase ninguém dava?

## Alternativas consideradas

1. **Manter o consentimento por profissional.** Já era a regra; o produto a recusou pelo efeito prático.
2. **Perfil sempre público, sem nenhuma base registrada.** Simples, mas deixa o estabelecimento publicar dado de terceiro
   sem rastro de quem respondeu por isso. Rejeitada.
3. **Perfil sempre público, com declaração do dono (quem não tem conta) e controle do próprio profissional (quem tem).**
   Escolhida.

## Decisão

- Remove `ShowFullProfile`, `IsPubliclyVisible`, o consentimento por profissional e as duas rotas `public-profile-consent`.
  A vitrine mostra **todo profissional ativo** com nome, especialidade, bio, foto e, em Saúde, o registro profissional (opcional).
- **Sem conta:** para salvar a bio, o dono marca "Declaro ter autorização desta pessoa para exibir estes dados publicamente".
  Registra-se **quem** declarou, **quando** e a **versão do texto**. A foto enviada pelo dono exige a declaração antes.
- **Com conta:** a pessoa aceita o termo na tela do convite (ADR-029) e passa a controlar a própria bio e foto. A declaração
  do dono deixa de ser a base.
- **Saída e remoção:** desativar tira o perfil da vitrine na hora; "Sair do estabelecimento" (a vir) remove o vínculo; e
  "Solicitar remoção deste perfil" na página pública (a vir) gera aviso ao dono e fila do Admin.
- **Desativar nunca é barrado** por falta de declaração (inclusive nos cadastros anteriores a ela).
- **Dados antigos:** a migration descarta o consentimento antigo (era do profissional; a declaração é do dono, outro fato) e
  **não** preenche declaração. Todo profissional ativo passa a aparecer completo. Quem tinha bio sem declaração só é barrado
  ao **editar** a bio de novo.

## Consequências

**Positivas.** A vitrine volta a ter rosto; há um responsável registrado por cada dado exibido; o profissional com conta tem
controle.

**Negativas / riscos.**
- Uma declaração marcada por um dono de má-fé é só uma declaração; a mitigação é a remoção a pedido e a fila do Admin.
- A migration publica de uma vez o perfil de quem estava privado. Revisar antes de aplicar em qualquer base com dado real.
- LGPD: foto, nome e apresentação de uma pessoa natural são dado pessoal; a base legal aqui é o consentimento declarado por
  terceiro (frágil) para quem não tem conta, e a execução do contrato de trabalho + aceite para quem tem. **Precisa de revisão
  jurídica antes de produção.**
- O registro profissional (número no conselho) é consultável publicamente, mas mesmo assim nunca entra em log.

## Referências

`docs/produto/contrato-api-frontend.md` §4.13 · `docs/legal/termo-profissional.md` · `docs/verificacao-pendente.md`
