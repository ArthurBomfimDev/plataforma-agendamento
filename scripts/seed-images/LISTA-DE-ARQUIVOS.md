# Imagens de demonstração: o que baixar

Lista dos arquivos que o `scripts/seed-demo.ts` procura nesta pasta. **Nenhuma imagem está aqui ainda**: o ambiente do Claude Code não alcança os bancos de imagem (Unsplash e Pixabay pedem login ou chave de API; o Pexels bloqueia robôs), e inventar autor e licença seria pior do que não ter a foto. O seed funciona sem elas (o estabelecimento fica com a ilustração padrão).

## Regras

- **Bancos:** Unsplash, Pexels ou Pixabay, só com licença que dispensa atribuição. Guarde a página da foto (URL), o autor, a licença e a data do download em `CREDITS.md`: o TCC usa essa lista no apêndice.
- **Formato:** WebP, **até 200 KB**, lado maior de uns 1600 px. Um arquivo só por foto: a API gera os três tamanhos (160, 640 e 1280 px) no envio.
- **Gente:** evite rosto reconhecível, principalmente nas áreas de **saúde** (o agendamento já é dado sensível); prefira o ambiente, as mãos, os objetos. Foto de profissional não entra: o avatar com iniciais é o padrão.
- **Nomes:** exatamente os abaixo (minúsculas, sem acento). `vitrine-<tipo>-N` são as 3 fotos da vitrine de todo estabelecimento do tipo (o seed gira a ordem de um para outro); `servico-<tipo>-<serviço>` é a foto do serviço.
- **Conferir:** `bun scripts/seed-images/verificar.ts` mostra o que falta, o que passa de 200 KB e o que está sem crédito.
- **Aplicar:** as imagens só entram num banco novo (o seed pula o que já existe): `docker compose down -v`, `up`, `bun scripts/seed-demo.ts`.

## Barbearia (`barbearia`)

| Arquivo | Busca sugerida (em inglês) |
|---|---|
| `vitrine-barbearia-1.webp` | barbershop interior |
| `vitrine-barbearia-2.webp` | barber haircut |
| `vitrine-barbearia-3.webp` | straight razor beard |
| `servico-barbearia-corte-masculino.webp` | men haircut barber scissors |
| `servico-barbearia-barba.webp` | beard trim straight razor |
| `servico-barbearia-corte-barba.webp` | haircut and beard barber hot towel |
| `servico-barbearia-pigmentacao.webp` | beard dye hair color men |

## Salão (`salao`)

| Arquivo | Busca sugerida (em inglês) |
|---|---|
| `vitrine-salao-1.webp` | hair salon interior |
| `vitrine-salao-2.webp` | hairdresser |
| `vitrine-salao-3.webp` | salon chairs |
| `servico-salao-corte-feminino.webp` | hairdresser cutting hair scissors |
| `servico-salao-escova.webp` | blow dry hair brush salon |
| `servico-salao-coloracao.webp` | hair coloring foil salon |
| `servico-salao-hidratacao.webp` | hair treatment mask salon |

## Esmalteria (`esmalteria`)

| Arquivo | Busca sugerida (em inglês) |
|---|---|
| `vitrine-esmalteria-1.webp` | nail salon |
| `vitrine-esmalteria-2.webp` | manicure |
| `vitrine-esmalteria-3.webp` | nail polish bottles |
| `servico-esmalteria-manicure.webp` | manicure nail polish hands |
| `servico-esmalteria-pedicure.webp` | pedicure feet nail polish |
| `servico-esmalteria-pe-e-mao.webp` | manicure and pedicure nail salon |
| `servico-esmalteria-unha-em-gel.webp` | gel nails extension nail art |

## Estética (`estetica`)

| Arquivo | Busca sugerida (em inglês) |
|---|---|
| `vitrine-estetica-1.webp` | beauty clinic |
| `vitrine-estetica-2.webp` | spa treatment room |
| `vitrine-estetica-3.webp` | skin care products |
| `servico-estetica-limpeza-de-pele.webp` | facial skin cleansing treatment |
| `servico-estetica-design-de-sobrancelha.webp` | eyebrow design threading |
| `servico-estetica-depilacao.webp` | waxing hair removal spa |

## Clínica de Fisioterapia (`fisioterapia`)

| Arquivo | Busca sugerida (em inglês) |
|---|---|
| `vitrine-fisioterapia-1.webp` | physiotherapy clinic |
| `vitrine-fisioterapia-2.webp` | rehabilitation equipment |
| `vitrine-fisioterapia-3.webp` | treatment room |
| `servico-fisioterapia-sessao-de-fisioterapia.webp` | physiotherapy session exercise |
| `servico-fisioterapia-avaliacao-fisioterapeutica.webp` | physical therapy assessment clipboard |

## Consultório de Nutrição (`nutricao`)

| Arquivo | Busca sugerida (em inglês) |
|---|---|
| `vitrine-nutricao-1.webp` | nutrition consultation office |
| `vitrine-nutricao-2.webp` | healthy food |
| `vitrine-nutricao-3.webp` | fruits and vegetables |
| `servico-nutricao-consulta-de-nutricao.webp` | nutritionist consultation desk |
| `servico-nutricao-retorno-de-nutricao.webp` | healthy meal plan notebook fruit |

## Consultório de Psicologia (`psicologia`)

| Arquivo | Busca sugerida (em inglês) |
|---|---|
| `vitrine-psicologia-1.webp` | therapy office interior |
| `vitrine-psicologia-2.webp` | armchairs |
| `vitrine-psicologia-3.webp` | calm consulting room |
| `servico-psicologia-sessao-de-psicoterapia.webp` | therapy room armchair plants |

## Clínica de Fonoaudiologia (`fonoaudiologia`)

| Arquivo | Busca sugerida (em inglês) |
|---|---|
| `vitrine-fonoaudiologia-1.webp` | speech therapy clinic |
| `vitrine-fonoaudiologia-2.webp` | children therapy room |
| `vitrine-fonoaudiologia-3.webp` | speech exercises |
| `servico-fonoaudiologia-sessao-de-fonoaudiologia.webp` | speech therapy session tools |

Total: 45 arquivos.
