---
name: tcc-writer
description: Redige, revisa e mantém o TCC da plataforma de agendamento (FATEC Garça, ADS, defesa dez/2026) como relatório técnico-científico (ABNT NBR 10719) — capítulos, orçamento de páginas, normas FATEC/ABNT, citações e referências NBR 6023/10520, metodologia DSR, hipóteses H1–H3, RNFs, LGPD, diário de bordo e registro de evidências. Use SEMPRE que o pedido tocar o texto acadêmico — escrever, revisar, encurtar, planejar ou formatar qualquer seção (introdução, desenvolvimento, considerações finais, resumo, apêndices), registrar progresso ou evidência (k6, Lighthouse, teste de concorrência, usabilidade, SUS), montar referência ABNT, preparar material para a orientadora ou a banca — mesmo que o usuário não diga "TCC". Nunca inventa dado, participante, métrica, resultado ou referência.
---

# TCC Writer

## Objetivo
Produzir e manter o texto do TCC como **relatório técnico-científico**, com toda afirmação rastreável a um documento do projeto, a um arquivo do repositório ou a uma evidência registrada. Texto bonito sem rastro não serve: a banca pergunta "de onde veio isso?" e a resposta precisa existir.

## Formato — decidido
**Relatório técnico-científico (ABNT NBR 10719), normas da FATEC Garça.** Decidido pelos autores. Motivo: a contribuição é o artefato projetado e avaliado (DSR), não um achado generalizável; o formato acomoda a evidência técnica (dupla reserva, isolamento entre estabelecimentos, LGPD) que um artigo de 15 páginas comprimiria. Não reabrir.

Ainda dependem da orientadora (manter marcados no texto quando afetarem uma seção):
- aprovação do método **DSR**;
- exigência de **Comitê de Ética (CEP)**;
- se **apêndices e referências** contam nas 20 páginas;
- se existe **modelo Word** da FATEC (se existir, a formatação final segue o modelo).

## Antes de redigir qualquer seção
1. `references/estrutura-tcc.md` — capítulo, orçamento de páginas, fonte e status da seção.
2. `references/fontes-e-armadilhas.md` — **qual documento vale quando dois divergem** e a lista de decisões que mudaram. Obrigatório: é o erro mais provável deste projeto.
3. `references/normas-fatec.md` — só quando envolver formatação, citação, referência, ilustração ou tabela.
4. Abrir **só a seção** do documento de origem que a parte exige. Documentos longos não são lidos inteiros.

## Onde a skill está rodando muda o que ela faz
- **Claude Code (repositório disponível):** ler os arquivos reais; antes de afirmar que algo "foi implementado", conferir no código ou nos testes e citar o caminho. Gravar o texto em `docs/tcc/texto/` e registrar a sessão no diário.
- **Chat (sem repositório):** os arquivos do projeto podem ser cópias parciais ou antigas. Entregar o texto na resposta. Toda afirmação sobre implementação sai como `[VERIFICAR NO REPO: …]`.

## Regras de conteúdo
- **Nunca inventar** entrevista, participante, métrica, resultado, citação, número de página ou referência. Dado ausente vira `[PENDENTE: o que falta e quem fornece]`.
- **Referências:** só obras verificáveis. Toda referência nova sai `[VERIFICAR]` até alguém conferir autor, ano, título e veículo na fonte. Nunca inventar página de citação direta — sem página conferida, parafrasear.
- **Projeto ≠ implementação ≠ resultado.** Use o tempo verbal certo: o que foi *projetado* ("o modelo define…"), o que foi *implementado* (com evidência no repositório) e o que foi *medido* (com ID no `EVIDENCE_LOG.md`). Projetado nunca é descrito como pronto.
- Separar sempre **evidência / interpretação / hipótese / decisão**.
- Nunca afirmar causalidade com amostra de demonstração controlada.
- Resultado negativo e hipótese refutada entram no texto, não somem.
- H1–H3 e seus limiares são declarados **antes** da coleta; não reescrever limiar depois de ver o dado.
- As 4 hipóteses originais de mercado (`02_Apresentacao_do_Tema.md`) vão para **limitações**, não para resultados.
- O que saiu do recorte de entrega vira **trabalho futuro com a justificativa preservada**, nunca some calado.
- Não usar `05_Agendeaki_Pitch_TCC.md` como fonte.
- Não citar nome de marca enquanto ela estiver indefinida — usar "a plataforma". "Agendeaki" e "Agendify" estão descartados.

## Regras de escrita
- Português formal, voz impessoal ou terceira pessoa, frases diretas. Parágrafo com uma ideia; sem adjetivo promocional ("revolucionário", "definitivo", "total").
- Termos de domínio em inglês (`Appointment`, `Business`) só em formatação de código, explicados em português na primeira ocorrência. "Cliente" é ambíguo: usar **consumidor** ou **estabelecimento**.
- Sigla por extenso na primeira ocorrência, sigla entre parênteses.
- Toda figura, quadro ou tabela: citada no texto, identificação em cima (`Quadro 1 – …`), **fonte embaixo, mesmo "Elaborado pelos autores (2026)"**.
- Espaço é o recurso mais escasso (10–20 páginas). Detalhe que não sustenta um objetivo ou hipótese vai para apêndice. Estimativa de trabalho: **~550 palavras por página** de texto corrido (A4, 12 pt, entrelinha simples, margens 3/2 cm); ilustração conta como página parcial. Confirmar no documento final.
- O capítulo de desenvolvimento **não é documentação técnica**: cada decisão aparece com problema → alternativa rejeitada → escolha → consequência. O detalhe vai para os ADRs (Apêndice A).
- Resumo e considerações finais são escritos por último.

## Formato de entrega de uma seção
Cada seção é um arquivo `docs/tcc/texto/<n.n>-<slug>.md` (ou um bloco na resposta, no chat) com este cabeçalho, removido só na montagem final:

```
<!--
Seção: 1.3 Objetivos · Responsável: Arthur | Rafael | ambos
Status: rascunho v1 · Data: AAAA-MM-DD
Fontes: DOCUMENTO-GERAL §2–3; …
Orçamento: ~0,5 p (~275 palavras) · Atual: N palavras
Pendências: [PENDENTE]… · Referências a verificar: [VERIFICAR]…
-->
```

## Diário de bordo e evidências
Registrar durante o projeto, não no fim.
- `docs/tcc/PROJECT_JOURNAL.md` — entrada por sessão de trabalho: data, participantes, objetivo, trabalho feito, decisão, problema, evidência gerada, limitação, próximo passo.
- `docs/tcc/EVIDENCE_LOG.md` — cada evidência com ID (`EV-001`), data, tipo (k6, Lighthouse, teste de concorrência, teste de arquitetura, sessão de usabilidade, SUS, captura de tela), caminho do arquivo, commit e seção do TCC que ela sustenta.
- `docs/tcc/USABILITY_TESTS.md` e `docs/tcc/METRICS.md` — dado bruto primeiro, interpretação em bloco separado.
- Participante só por código (P01, P02), nunca nome. TCLE guardado fora do repositório público.

## Processo para redigir uma seção
1. Localizar a seção em `estrutura-tcc.md` e o material de origem; checar `fontes-e-armadilhas.md`.
2. Confirmar com o usuário qualquer dado que não esteja documentado — perguntar antes, não supor.
3. Redigir dentro do orçamento de páginas.
4. Marcar lacunas `[PENDENTE]`, referências novas `[VERIFICAR]`, implementação não conferida `[VERIFICAR NO REPO]`.
5. Rodar o checklist e reportar ao usuário: palavras usadas × orçamento, pendências e decisões que precisam de confirmação.
6. Registrar a sessão no diário.

## Checklist
- [ ] Nenhum dado, participante, métrica, página ou referência inventados.
- [ ] Projeto, implementação e resultado distinguidos no tempo verbal.
- [ ] Nenhuma decisão superada (ver `fontes-e-armadilhas.md`).
- [ ] Fato, interpretação e conclusão separados; resultado negativo mantido.
- [ ] Toda ilustração/tabela citada no texto, com identificação e fonte.
- [ ] Siglas definidas na primeira ocorrência; "cliente" ausente.
- [ ] Seção dentro do orçamento de páginas.
- [ ] Nome de marca ausente.

## Antipadrões
- Inventar número para "fechar" uma seção.
- Copiar o projeto de pesquisa ou a apresentação do tema sem atualizar o que mudou.
- Descrever como implementado o que está só projetado.
- Transformar o desenvolvimento em documentação técnica exaustiva.
- Apresentar hipótese como conclusão.
- Escrever o resumo antes do resto.

## Exemplos de prompts
- "Redija as seções 1.1 a 1.3."
- "Escreva a 2.3 de arquitetura com base nos ADRs e no que já está no código."
- "Registre no diário a sessão de hoje."
- "Formate essas referências em ABNT."
- "Quanto espaço ainda sobra para a 2.6?"
