# ADR-023 — Imagens: armazenamento de arquivos atrás de porta, processamento com SkiaSharp

- **Status:** Proposto
- **Data:** 2026-10-28
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Tenancy (logotipo, capa), People (foto do profissional), `Common/Media`, frontend
- **Substitui:** —
- **Substituído por:** —
- **Complementa:** ADR-008 (Compose como unidade de implantação) e ADR-014 (perfil público dividido)

---

## Contexto

**Fato.** Até a Onda 6D, nenhuma tela tinha imagem real: o frontend mostrava blocos cinza onde o Figma prevê capa,
logotipo e foto.

**Fato.** Foto de celular leva EXIF, e o EXIF pode levar o GPS de onde a foto foi tirada — dado pessoal (LGPD).

**Fato.** Arquivo enviado por terceiros é a porta de ataque clássica: executável renomeado, SVG com script, imagem
"bomba" (dimensões gigantes num arquivo pequeno), nome de arquivo que sobe pastas (`../`).

**Fato.** A foto do profissional é dado pessoal; as decisões de 22/09 (§3) só mostram o perfil completo em rota pública
com consentimento.

**Fato, verificado em 28/10.** O `SixLabors.ImageSharp` 4.x avisa no build: *"Release builds require a valid
license"* — sem chave de licença (`SixLaborsLicenseKey`), o build de Release (o da imagem Docker) falha. A licença
comunitária é gratuita para quem fatura menos de US$ 1 mi/ano, mas é obtida por pedido e é uma credencial: não existe
no projeto. O 3.x não exige chave, mas é a linha anterior e concentra os avisos de segurança publicados (decodificadores
TIFF, EXR, GIF, ICC).

## Problema

Onde guardar os bytes, como recusar arquivo malicioso, como tirar o dado pessoal da imagem e com que biblioteca — de um
jeito que trocar o disco local por um armazenamento externo depois não mexa no domínio?

## Alternativas consideradas

### Armazenamento

**A — Bytes no banco (`bytea`).** Backup único e transação junto. Contra: o banco cresce com mídia, cada leitura de
imagem passa pela API e pelo PostgreSQL, e o cache HTTP fica a cargo do código.

**B — Arquivos num armazenamento atrás de porta; o banco guarda só o caminho.** Disco local (volume) agora, S3
compatível depois. Contra: dois backups que precisam andar juntos.

### Biblioteca

**C — ImageSharp 4.** API mais completa, só código gerenciado. Contra: chave de licença obrigatória no Release.
**D — ImageSharp 3.** Sem chave. Contra: linha anterior, com a maior parte dos avisos de segurança.
**E — SkiaSharp (MIT).** Sem chave, mantido pela Microsoft, decodifica JPEG/PNG/WebP e codifica WebP. Contra: binário
nativo por plataforma (no Docker, `SkiaSharp.NativeAssets.Linux.NoDependencies`), e a orientação EXIF é aplicada à mão.
**F — Magick.NET.** Licença permissiva, muitos formatos. Contra: binário nativo grande, superfície de ataque maior do
que o necessário para três formatos.

## Decisão

Adotamos **B** com **E**.

- **Porta `IFileStorage`** (`SaveAsync`, `DeleteAsync`, `GetUrl`) em `Application/Common/Media`. Adaptador
  `DiskFileStorage` (`Storage__Root`); no Compose, o volume nomeado `media-data`. O **adaptador S3 compatível**
  (Cloudflare R2, por exemplo) fica **documentado, não implementado**: `GetUrl` passa a devolver URL absoluta do
  bucket/CDN, e o frontend já aceita as duas formas.
- **O banco guarda só a referência** (`logo_image_key`, `cover_image_key`, `photo_image_key`, até 200 caracteres), no
  formato `businesses/{id}/{guid}` — gerado pelo sistema, nunca o nome enviado. Migration `AddImages`, aditiva.
- **Serviço em `/media/…`** pela própria API (arquivos estáticos), só `.webp`, com `Cache-Control: public,
  max-age=31536000, immutable` (nomes aleatórios, nunca reutilizados) e `X-Content-Type-Options: nosniff`.
- **Validação, nesta ordem, antes de qualquer decodificação:** tamanho (até **5 MB**, lido no máximo 5 MB + 1) →
  **assinatura do conteúdo** (só JPEG, PNG, WebP; nunca extensão nem `Content-Type`; SVG recusado) → **dimensões pelo
  cabeçalho** (até 6000 px de lado e 36 Mpx), recusadas sem alocar os pixels.
- **Processamento (`SkiaImageProcessor`):** orientação EXIF aplicada, reencode em **WebP** nos tamanhos **160, 640 e
  1280 px** (lado maior, nunca aumenta). O WebP gerado só leva pixels: **nenhum metadado** do original passa (EXIF,
  GPS, XMP, ICC) — o teste P5 envia um JPEG com bloco GPS e procura o marcador nos três arquivos.
- **Sem saída da pasta por nome:** a referência é validada no domínio (`ImageKey`) e o caminho, de novo, no adaptador
  de disco (formato fixo e caminho final dentro da raiz).
- **Quem envia:** logotipo e capa, só o dono do estabelecimento do contexto ativo; foto do profissional, o dono ou o
  próprio profissional (pelo vínculo da conta). Profissional de outro estabelecimento: 404 (filtro de tenant).
- **Limite:** 20 envios por hora por usuário (política `uploads`).
- **Troca apaga os arquivos antigos** — depois de gravar a troca, para nunca ficar sem imagem se a gravação falhar; se
  a gravação falhar, os arquivos novos é que são apagados.
- **Rota pública:** a foto do profissional só sai com o perfil completo visível (consentimento); sem isso, `photo` é nulo.
- **Respostas:** `logo`, `cover`, `photo` como `null` ou `{ small, medium, large }`.
- **Seed não envia imagens.** Sem imagem, o frontend mostra padrões próprios: ilustração por categoria (SVG pintado só
  com tokens da R5, que segue o tema claro e o escuro), iniciais sobre `action/soft` para o profissional e ícone por
  categoria para o serviço.

## Consequências

### O que fica mais fácil

- Trocar disco por S3 compatível é um adaptador novo de `IFileStorage` e configuração.
- A CDN ou o navegador guardam cada imagem para sempre: o nome nunca muda de conteúdo.
- Nenhuma imagem guardada leva dado pessoal escondido.

### O que fica mais difícil

- **Backup em dois lugares:** banco e volume `media-data` precisam ser copiados juntos (README, "Backup").
- **Limpeza ao remover** estabelecimento ou profissional: hoje não há remoção definitiva de nenhum dos dois; quando
  houver, ela precisa apagar os arquivos (pendência registrada).
- Binário nativo do Skia por plataforma; trocar a imagem base do Docker (por Alpine, por exemplo) exige o pacote
  nativo `musl` correspondente.
- Sem moderação de conteúdo: qualquer imagem válida do dono é publicada.

### O que passa a ser proibido

- Gravar bytes de imagem no banco.
- Confiar em extensão ou `Content-Type` para decidir o tipo do arquivo.
- Guardar a imagem enviada sem reencodar (o original, com metadados, nunca é salvo).
- Usar o nome de arquivo enviado em qualquer caminho.

## Licença e dependências

- `SkiaSharp` e `SkiaSharp.NativeAssets.Linux.NoDependencies` 4.154.0 — **MIT**. Conferido no build de Release (imagem
  Docker) e com `ldd` no binário nativo linux-x64 dentro da imagem: todas as dependências resolvidas.
- **ImageSharp rejeitado por licença operacional, não por qualidade.** Se o projeto obtiver a licença comunitária (ou
  comercial, acima de US$ 1 mi/ano), trocar de biblioteca é trocar o adaptador de `IImageProcessor`.

## Premissa não verificada

**O WebP do Skia não carrega metadado algum em nenhum caso.** Verificado para JPEG com EXIF/GPS (teste P5); não foi
verificado para PNG com blocos `tEXt`/`iTXt` nem para WebP de entrada com EXIF. Se aparecer metadado num desses casos, o
processador precisa copiar só os pixels para um bitmap novo antes de codificar (ele já decodifica para um bitmap, então o
risco é baixo).

## Como saber que erramos

- Se o volume de mídia crescer a ponto de o disco do servidor virar o gargalo (hora de S3 compatível).
- Se um formato aceito passar com metadado pessoal num teste novo.

## Referências

- `backend/src/Core/Booking.Application/Common/Media/` — `IFileStorage`, `IImageProcessor`, `ImageSignature`, `ImageStore`
- `backend/src/Infrastructure/Booking.Infrastructure/Module/Media/` — `DiskFileStorage`, `SkiaImageProcessor`
- `backend/src/Presentation/Booking.Api/Common/MediaFiles.cs`
- `backend/tests/Booking.IntegrationTests/Media/ImageTests.cs` — P1 a P10; `Booking.UnitTests/Media/MediaTests.cs`
- Decisões de 22/09 §3 (perfil público e consentimento)
