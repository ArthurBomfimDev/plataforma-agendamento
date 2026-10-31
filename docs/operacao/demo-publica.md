# Demonstração pública pelo Cloudflare Tunnel

Como abrir a pilha local para quem está fora da sua rede (banca, participantes de teste de usabilidade, colegas)
por um endereço `https://….trycloudflare.com`, sem abrir porta no roteador e sem hospedagem paga. É o caminho de
"última instância" da ADR-008, implementado na Onda 7H.

> **Quem tiver o link entra.** O túnel rápido não tem senha nem lista de convidados: qualquer pessoa com o endereço
> abre o site. Trate o link como uma chave e derrube o túnel quando a sessão acabar.

---

## Como funciona

```
navegador ──https──> Cloudflare ──túnel──> cloudflared ──> web (nginx :80) ──┬──> site (arquivos do Vite)
                                            (contêiner)                       ├──> /api/   ──> api :8080
                                                                              └──> /media/ ──> api :8080
```

- **Uma origem só.** O site chama a API em `/api` no mesmo endereço; o nginx repassa. Sem CORS e sem `localhost`
  no navegador. O build do frontend não embute URL de API (`VITE_API_BASE_URL` vazio por padrão).
- **Só o `web` vai para o túnel.** O `cloudflared` roda dentro da rede do compose e aponta para `http://web:80`.
  A API (8081), o banco (5433) e o Mailpit (8025) continuam escutando só em `127.0.0.1`.
- **O Mailpit nunca fica público.** Ele mostra os e-mails de todo mundo, com os links de confirmação e de nova senha.
  Nenhuma rota do nginx leva a ele, e o túnel não o enxerga.
- **A API sobe em `Production`** durante a demonstração: HSTS ligado, sem OpenAPI, e ela se recusa a subir com a
  chave JWT de exemplo do `.env.example`.
- **IP real no limitador.** A API confia no `X-Forwarded-For` só das redes privadas do Docker
  (`ForwardedHeaders__KnownNetworks__*` no `compose.yaml`), e para no primeiro IP de fora: o limite de 10 tentativas
  de login por minuto vale por pessoa, não para todo mundo junto.

---

## Antes de abrir: checklist de segurança

- [ ] O `.env` foi gerado pelo `scripts/setup-env` (senha do banco e chave JWT aleatórias). Com a chave de exemplo,
      a API nem sobe em `Production` — é de propósito.
- [ ] As contas de demonstração vão usar **uma senha sua**: `SEED_PASSWORD` definida ao rodar o seed. Fora de
      Development, o seed recusa a senha padrão do repositório (`--permitir-senha-padrao` só se você aceitar que
      qualquer um entre nelas).
- [ ] A senha do Admin (`admin@example.com`) é `SEED_ADMIN_PASSWORD`, ou a aleatória que o seed mostra **uma vez** no
      fim. Anote na hora; ela não aparece de novo.
- [ ] Se o banco já tinha sido populado em Development (senha padrão), **recrie o banco** antes de abrir
      (`docker compose down -v`) ou troque as senhas: as contas antigas continuam com a senha pública.
- [ ] E-mail: com o bloco do Gmail preenchido, cadastro novo recebe a confirmação. Sem ele, só as contas do seed
      entram (o script avisa).
- [ ] Ninguém além de você tem acesso ao `.env` (senha de app, chave JWT, senha do banco).
- [ ] Você sabe derrubar (fim desta página) e vai derrubar quando acabar.

---

## Subir e pegar o endereço

### Windows 11 (PowerShell)

Pré-requisitos: Docker Desktop rodando, `.env` gerado (`./scripts/setup-env.ps1`).

```powershell
./scripts/demo-publica.ps1
```

### Linux (bash)

Pré-requisitos: Docker com o plugin `compose`, `curl`, `.env` gerado (`./scripts/setup-env.sh`). Opcional:
`qrencode`, para o script mostrar um QR code do endereço.

```bash
./scripts/demo-publica.sh
```

### O que o script faz

1. Avisa se não há SMTP configurado.
2. Sobe a pilha com a API em `Production` e o perfil `tunnel` (`cloudflared`).
3. Espera o endereço `https://….trycloudflare.com` aparecer no log do `cloudflared`.
4. Recria **só a API** com `APP_PUBLIC_BASE_URL` igual a esse endereço: os links dos e-mails (confirmação, nova
   senha) passam a apontar para ele.
5. Espera `/api/health` responder pelo endereço público e mostra o endereço.

Depois, popule as contas de demonstração (uma vez por banco), com uma senha sua:

```powershell
$env:SEED_PASSWORD = '<uma senha sua, 12+ caracteres>'; bun scripts/seed-demo.ts
```

```bash
SEED_PASSWORD='<uma senha sua, 12+ caracteres>' bun scripts/seed-demo.ts
```

### Mandar para as pessoas

Mande o endereço por um canal privado (mensagem direta, e-mail para quem participa). Não publique em rede social nem
em grupo aberto. Se for passar contas de demonstração, passe a senha por outro canal, não junto do link.

---

## Quando o endereço muda

O túnel rápido gera **um endereço novo a cada subida** do `cloudflared` (reinício do Docker, do computador, ou
`-Parar` seguido de nova subida). O endereço antigo deixa de funcionar na hora.

1. Rode o script de novo: ele pega o endereço novo e recria a API com ele.
2. Mande o endereço novo para as pessoas.
3. E-mails enviados antes da troca têm links com o endereço antigo: quem precisar, pede o link de novo
   ("Esqueci minha senha" ou reenvio da confirmação).

Para um endereço fixo, use o **túnel nomeado** (abaixo).

### Túnel nomeado (opcional, endereço fixo)

Exige um domínio seu na Cloudflare. No painel (Zero Trust → Networks → Tunnels), crie um túnel, aponte o hostname
público para `http://web:80` e copie o token. No `.env`, `TUNNEL_TOKEN=<token>` e `APP_PUBLIC_BASE_URL=https://<seu
hostname>`. Suba com `ASPNETCORE_ENVIRONMENT=Production` e `docker compose --profile tunnel-named up -d --build`.
O token é credencial: só no `.env`.

---

## Derrubar

```powershell
./scripts/demo-publica.ps1 -Parar
```

```bash
./scripts/demo-publica.sh --parar
```

Remove o `cloudflared` (o endereço deixa de funcionar) e recria a API em Development, com links para
`http://localhost:8080`. O resto da pilha continua rodando; `docker compose down` para tudo.

---

## E-mail de verdade pelo Gmail

Sem SMTP, os e-mails vão para o Mailpit, que só você vê em `http://localhost:8025`. Para que quem se cadastra pelo
link receba a confirmação, configure uma conta Gmail.

### Criar a senha de app

1. Entre na conta Gmail que vai enviar (por exemplo, a conta do projeto).
2. Ative a **verificação em duas etapas** (Conta Google → Segurança). Sem ela, a opção de senha de app não aparece.
3. Abra **Senhas de app** (Conta Google → Segurança → Senhas de app, ou a busca "senhas de app" nas configurações),
   dê um nome (por exemplo, "Vagoo demo") e gere.
4. O Google mostra 16 letras em quatro grupos. Copie **sem os espaços**. Essa senha só aparece uma vez.

### Preencher o `.env`

Tire o `#` do bloco do Gmail no `.env` (modelo no `.env.example`) e preencha:

```
Email__Smtp__Host=smtp.gmail.com
Email__Smtp__Port=587
Email__Smtp__UseSsl=true
Email__Smtp__Username=<a conta Gmail>
Email__Smtp__Password=<a senha de app, 16 letras, sem espaços>
Email__From=<a mesma conta Gmail>
Email__FromName=Vagoo
```

- **`Email__From` igual a `Email__Smtp__Username`.** O Gmail exige que o remetente seja a conta autenticada.
- A senha de app fica **só no `.env`**, que não é versionado (`.gitignore`). Nunca em commit, issue, chat ou print.
- Porta 587 com STARTTLS **obrigatório**: se o servidor não oferecer TLS, a API não manda a senha.
- Rode o script de novo (ou recrie a API) para valer.

### Conferir

Peça "Esqueci minha senha" para um endereço seu. Na outbox, a entrega fica com `processed_at` preenchido:

```bash
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT id, attempts, processed_at, last_error FROM notifications.outbox ORDER BY created_at DESC LIMIT 5"'
```

Se o Gmail recusar o login, a entrega não se perde: volta para a fila com nova tentativa, e `last_error` diz
`SMTP recusou o login de <conta> em smtp.gmail.com:587` — sem a senha.

### Limites

- **Cerca de 500 mensagens por dia** numa conta Gmail comum. Para uma sessão de demonstração sobra; para cadastro em
  massa, não.
- **Remetente novo cai no spam com frequência.** Avise as pessoas para olhar a caixa de spam e marcar "não é spam".
- A conta pode ser bloqueada temporariamente se o Google estranhar o volume.

---

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| O script para em "Esperando o endereço do túnel" | Sem internet, ou a Cloudflare limitou túneis rápidos | `docker compose logs cloudflared`; tente de novo em alguns minutos |
| A API não sobe; log fala em `Jwt:SigningKey` | `.env` com a chave de exemplo | Gere outra com `scripts/setup-env` (apague o `.env` antes) ou troque `JWT_SIGNING_KEY` |
| O seed recusa com "senha padrão do repositório" | `SEED_PASSWORD` vazia com a API em `Production` | Defina `SEED_PASSWORD` |
| Cadastro novo não recebe e-mail | Sem SMTP (vai para o Mailpit), ou Gmail recusou | Preencha o Gmail; veja `last_error` na outbox; olhe o spam |
| Link do e-mail abre `localhost` | A API não foi recriada com o endereço do túnel | Rode o script de novo |
| Link do e-mail dá "não encontrado" | O endereço mudou depois do envio | Peça o link de novo |
| `curl` no Windows falha no `https://` | Verificação de revogação do Schannel | `curl.exe --ssl-no-revoke …`, ou teste no navegador |
| Muitos "429" no login | Limite de 10 tentativas por minuto por IP | Espere um minuto; é o freio de força bruta |
| O site abre, mas sem estilos ou em branco | Imagem do `web` antiga | `docker compose up -d --build web` |

---

## Referências

- ADR-008 — hospedagem (este é o caminho da máquina própria) · ADR-021 — e-mail por outbox
- `compose.yaml` (perfis `tunnel` e `tunnel-named`) · `frontend/nginx.conf` · `scripts/demo-publica.ps1` e `.sh`
- `.env.example` (bloco do Gmail, `SEED_PASSWORD`, `SEED_ADMIN_PASSWORD`)
