# Publicação da demonstração final (Tailscale Funnel)

Como colocar a demonstração do TCC no ar a partir da máquina do Arthur (Windows 11, Docker Desktop), num endereço
`https://vagoo.<tailnet>.ts.net`, sem abrir porta no roteador e sem hospedagem paga. A decisão e as limitações estão no
**ADR-036** (Proposto). Esta página é o passo a passo.

> **Quem tiver o link entra.** O Funnel é público: não há senha nem lista de convidados. Trate o endereço como chave,
> mande por canal privado e derrube o Funnel quando a sessão acabar (seção "Derrubar").
>
> **Os dados são fictícios** e **não são evidência para o TCC** (ver `docs/operacao/seed-demo.md`). A faixa "Ambiente de
> demonstração — dados fictícios" aparece no topo de toda tela.

---

## Como funciona

```
navegador ──https──> Tailscale (Funnel) ──> tailscaled (host) ──> 127.0.0.1:8090 ──> web (nginx) ──┬──> site (Vite)
                                                                                                    ├──> /api/   ──> api (rede do compose)
                                                                                                    └──> /media/ ──> api
```

- **Um único origin.** O nginx do `web` já entrega o site e, atrás dele, `/api/` e `/media/` (`frontend/nginx.conf`). O
  frontend chama `/api` na própria origem (`VITE_API_BASE_URL` vazio): sem CORS e sem `localhost` no navegador. **Nada
  precisou mudar nisso**; só a porta do `web` é alvo do Funnel.
- **O que sai da máquina.** Só a porta do `web`. O `compose.demo.yaml` não publica banco nem API no host, e o Mailpit
  fica em `127.0.0.1:8025`, **fora do Funnel**: ele mostra o e-mail de todo mundo, com links de confirmação.
- **Domínio por variável.** O endereço `https://vagoo.<tailnet>.ts.net` entra pelo `.env` (`PUBLIC_ORIGIN`), nunca no
  código. A CSP do nginx é `'self'` (inclusive `connect-src`, já que API e mídia são da mesma origem), com **uma exceção**:
  `img-src` também aceita `https://tile.openstreetmap.org`, os ladrilhos do mapa em que o dono ajusta o pino do endereço no
  cadastro. É a única origem externa; o navegador de quem cadastra o estabelecimento consulta o OpenStreetMap (IP e área
  vista), e o site manda só a origem como referência (`referrerPolicy: 'origin'` no ladrilho).
- **IP real no limitador.** `UseForwardedHeaders` roda antes do limitador (`Program.cs`). A API confia em
  `X-Forwarded-For` só da sub-rede do compose (`DEMO_SUBNET`). O teste de integração `I7` cobre isso, inclusive que um
  salto de fora da sub-rede não é pulado. **Escrito e compilado, mas ainda não executado** (ver o relatório da rodada).

---

## Uma vez só: preparar o Tailscale

Fazer no painel `https://login.tailscale.com/admin` (conta do Arthur) e no Windows. **Não foi feito nesta rodada**: o
repositório só prepara; nenhum comando `tailscale` foi executado.

1. Instale o Tailscale no Windows 11 e entre na sua conta.
2. Painel → **DNS**: ligue **MagicDNS**.
3. Painel → **DNS** → **HTTPS Certificates** → **Enable HTTPS**. Isso emite o certificado do `*.ts.net`. Atenção: o nome
   da máquina passa a constar no registro público de certificados.
4. Garanta que a política de acesso permite o Funnel para esta máquina (atributo `funnel`; o painel oferece ativar na
   primeira vez que o comando abaixo é rodado).
5. Dê um nome estável à máquina (o endereço será `https://vagoo.<tailnet>.ts.net`):

   ```powershell
   tailscale set --hostname=vagoo
   ```

6. Anote o endereço completo (o `tailscale funnel status`, mais adiante, mostra). É ele o `PUBLIC_ORIGIN`.

---

## Preparar o `.env` (fora do git)

O `.env` **não é versionado** e ninguém além de você pode lê-lo. Gere-o com `./scripts/setup-env.ps1` e acrescente:

```dotenv
PUBLIC_ORIGIN=https://vagoo.SEU-TAILNET.ts.net
WEB_PORT=8090
# DEMO_BANNER=Ambiente de demonstração — dados fictícios   (padrão: vazio, sem faixa; preencha para ligá-la)
# DEMO_SUBNET=172.28.0.0/24                                 (troque só se colidir com outra rede do Docker)
```

---

## Subir

```powershell
$env:COMPOSE_FILE = "compose.yaml;compose.demo.yaml"
docker compose --env-file .env up -d --build
docker compose ps
```

`COMPOSE_FILE` faz todo comando seguinte (`logs`, `down`, e o `docker compose exec` do seed) enxergar as duas camadas.
Confira que **só** `web` (`127.0.0.1:8090`) e `mailpit` (`127.0.0.1:8025`) publicam porta, e que a API está em
`Production`:

```powershell
docker compose exec -T api printenv ASPNETCORE_ENVIRONMENT
curl.exe -s http://127.0.0.1:8090/api/health
```

### Popular com os dados de demonstração

O seed fala com a API **pelo `web`** (a API não tem porta no host) e com o banco por `docker compose exec`:

```powershell
$env:API_URL = "http://127.0.0.1:8090"
$env:SEED_PASSWORD = '<senha forte sua, 12+ caracteres>'
$env:SEED_ADMIN_PASSWORD = '<outra senha forte sua>'
bun scripts/seed-demo.ts --passado
```

As duas senhas **só por variável de ambiente**: não estão no código, no log nem no repositório. Fora de Development o
seed recusa a senha padrão. Demora alguns minutos: as rotas de autenticação aceitam 10 chamadas por minuto por IP, e o
seed espera quando recebe 429. Feche o PowerShell depois, ou apague as variáveis (`Remove-Item Env:SEED_*`).

---

## Abrir o Funnel

```powershell
tailscale funnel --bg 8090
tailscale funnel status
```

O `status` mostra `https://vagoo.<tailnet>.ts.net` apontando para `http://127.0.0.1:8090`. Abra o endereço **de fora da
sua rede** (dados móveis, por exemplo) e entre com `consumidor@example.com`.

---

## Checklist antes de abrir

- [ ] **Chave JWT rotacionada.** Não use a do `.env.example` nem uma que já apareceu em tela, chat ou log (a API em
      `Production` já recusa a de exemplo). Gere outra e troque `JWT_SIGNING_KEY` no `.env`; todo mundo é desconectado:

      ```powershell
      $b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
      ```

- [ ] **Senhas fortes** do Admin (`SEED_ADMIN_PASSWORD`) e das contas do seed (`SEED_PASSWORD`), e da conta do banco
      (`POSTGRES_PASSWORD`). Nenhuma é a padrão do repositório.
- [ ] **`.env` fora do git** (`git status` não o lista; o `.gitignore` o cobre) e sem cópia em pasta sincronizada.
- [ ] **Banco novo.** Se ele já tinha sido populado em Development (senha pública), recrie: `docker compose down -v`.
- [ ] **E-mail só no Mailpit local.** Cadastro novo não recebe confirmação por e-mail de verdade; só as contas do seed
      entram. Quem for demonstrar cadastro lê o e-mail em `http://127.0.0.1:8025`, na própria máquina.
- [ ] **Sem suspensão.** Em Configurações → Sistema → Energia, "Suspensão" em **Nunca** quando na tomada (ou
      `powercfg /change standby-timeout-ac 0`). Máquina dormindo é Funnel fora do ar.
- [ ] **Docker inicia com o Windows.** Docker Desktop → Settings → General → *Start Docker Desktop when you sign in*.
      Os contêineres voltam sozinhos (`restart: unless-stopped`). O Tailscale também deve iniciar com o Windows.
- [ ] **O Funnel só expõe o 8090** (`tailscale funnel status`). Nenhuma outra porta; o Mailpit nunca.
- [ ] **A faixa de demonstração:** por padrão **não aparece** (decisão de 11/11). Se quiser o aviso no topo, preencha
      `DEMO_BANNER` no `.env` e reconstrua o `web`; se ele aparecer sem você ter pedido, `DEMO_BANNER` ficou preenchido.
- [ ] Você sabe derrubar (abaixo) e vai derrubar quando acabar.

---

## Derrubar

```powershell
tailscale funnel reset
tailscale funnel status
```

`reset` desliga o Funnel (e qualquer outra publicação do `serve`/`funnel` desta máquina). O `status` deve voltar a
dizer que nada está exposto. Para parar também a pilha: `docker compose down` (preserva os dados).

## Restaurar a demonstração do zero

Apaga o banco e as imagens e recomeça:

```powershell
docker compose down -v
docker compose --env-file .env up -d --build
# esperar a API: curl.exe -s http://127.0.0.1:8090/api/health
$env:API_URL = "http://127.0.0.1:8090"; bun scripts/seed-demo.ts --passado   # com SEED_PASSWORD e SEED_ADMIN_PASSWORD
```

`down -v` apaga **todos** os volumes desta pilha (`db-data` e `media-data`). É o que se quer aqui; **não** rode na pilha
de desenvolvimento do dia a dia sem querer perder os dados dela.

---

## Se algo der errado

| Sintoma | Provável causa |
|---|---|
| `tailscale funnel` diz que o Funnel não está habilitado | Falta HTTPS Certificates ou o atributo `funnel` na política (passos 3 e 4) |
| Todo mundo toma "muitas tentativas" no login | O limitador está vendo um só IP (o do host/gateway): o Funnel não repassou `X-Forwarded-For`. Ver "Não verificado" |
| O site abre mas `/api` dá 502 | A API ainda sobe (`docker compose logs api`) ou recusou a chave JWT de exemplo |
| `docker compose up` falha por rede | A sub-rede `172.28.0.0/24` colide com outra: defina `DEMO_SUBNET` |
| Página não atualiza depois de um deploy | O PWA pergunta "Nova versão disponível"; toque em Atualizar (ADR-035) |
| Foto não aparece | O envio de fotos pelo seed só roda com a API ativa e aprovada; rode o seed de novo (é idempotente) |

---

## Não verificado nesta rodada

O repositório foi preparado **sem** ligar o Funnel, sem rodar `tailscale` e sem mexer em credencial. Falta conferir, com o
Funnel de fato ligado:

- [ ] Se o Funnel envia `X-Forwarded-For` (com o IP do visitante) e `X-Forwarded-Proto: https` ao `127.0.0.1:8090`.
      Sem o primeiro, o limite de 10 tentativas por minuto vira um só para todos; sem o segundo, não sai HSTS.
- [ ] Qual endereço o nginx enxerga como origem (o gateway da sub-rede, `172.28.0.1`, é o esperado). Se for outro, o
      `DEMO_SUBNET` precisa cobri-lo, senão a API não pula esse salto.
- [ ] O limite de banda do Funnel com várias pessoas ao mesmo tempo (ele existe e não é configurável).
- [ ] Tempo de resposta pela internet, da carga das fotos e do primeiro carregamento do PWA.
