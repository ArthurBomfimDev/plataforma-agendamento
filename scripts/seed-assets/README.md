# Imagens do seed de demonstração

O seed (`scripts/seed-demo.ts`) envia fotos de estabelecimentos, serviços e profissionais **pelo mesmo caminho da
interface**: `PUT` multipart, campo `file`, JPEG, PNG ou WebP, até 5 MB. A API converte nos três tamanhos.

## Sem fazer nada

Sem arquivos nesta pasta, o seed **gera** imagens originais por código (`scripts/seed-demo/png.ts`): fundo em degradê de
uma cor estável por nome, mais as iniciais ou uma silhueta. Nada é baixado e nenhuma imagem de terceiros entra no
repositório.

## Com as suas imagens

Coloque o arquivo em uma subpasta pelo **tipo**, com o nome do item sem acento, em minúsculas e com hífen:

| Subpasta | Nome do arquivo | Exemplo |
|---|---|---|
| `logo/` | nome do estabelecimento | `logo/estudio-duartina.jpg` |
| `cover/` | nome do estabelecimento | `cover/barbearia-do-rogerio.webp` |
| `service/` | nome do serviço | `service/corte-masculino.jpg` |
| `professional/` | nome de exibição do profissional | `professional/marcos-lima.png` |
| itrine/ | tipo do estabelecimento e número (1 a 3) | itrine/barbearia-2.webp |

Vale o primeiro arquivo achado na ordem `png`, `jpg`, `jpeg`, `webp`. O que não tiver arquivo continua gerado.

> Use só imagens **suas** ou com licença clara que permita o uso. As imagens desta pasta não são versionadas por
> padrão (ver `.gitignore`): o repositório não deve carregar foto de pessoa nem de marca.

A lista dos arquivos de banco de imagem a baixar (`vitrine/` e `service/`), com busca sugerida, créditos e conferência (`bun scripts/seed-assets/verificar.ts`), está em `LISTA-DE-ARQUIVOS.md`, `CREDITS.md` e `verificar.ts` desta pasta.

As imagens são fictícias como o resto da demonstração e **não são evidência** para o TCC.
