# ADR-036 — Implantação da demonstração na máquina do autor, publicada por Tailscale Funnel

- **Status:** Proposto
- **Data:** 2026-11-11
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** infraestrutura (compose), Identity (limitador por IP), frontend (aviso de demonstração)
- **Substitui:** — (complementa o ADR-008 e a Onda 7H, que usou Cloudflare Tunnel)
- **Substituído por:** —

---

## Contexto

**Fatos.** Para a defesa do TCC é preciso um endereço público onde a banca e os participantes abram o sistema inteiro.
O projeto não tem verba de hospedagem. O ADR-008 deixou a hospedagem aberta e a Onda 7H já publica a pilha local por
Cloudflare Tunnel (`docs/operacao/demo-publica.md`), que exige domínio na Cloudflare para endereço fixo; o modo rápido
muda de endereço a cada subida. O nginx do `web` já entrega site, `/api/` e `/media/` num único origin e a API já aceita
`X-Forwarded-*` de proxies configurados, antes do limitador.

**Fato legal.** O consumidor de saúde tem o próprio agendamento como dado sensível (LGPD Art. 11). A demonstração usa só
dado fictício, mas a infraestrutura precisa se comportar como se o dado fosse real.

**Inferência nossa.** A máquina do autor (Windows 11, Docker Desktop) basta para a carga de uma banca; um endereço
estável (`https://vagoo.<tailnet>.ts.net`) é melhor que um novo a cada subida.

## Problema

Onde hospedar a demonstração final, sem custo e com endereço estável, expondo o mínimo possível?

## Alternativas consideradas

### A — Máquina do autor com Tailscale Funnel (`compose.demo.yaml`)

**A favor:** custo zero; HTTPS e endereço estável (`*.ts.net`) sem domínio próprio e sem abrir porta no roteador; só a
porta do `web` é publicada; reaproveita a pilha que já roda.
**Contra:** a máquina precisa ficar ligada, acordada e com Docker e Tailscale em execução; sem domínio próprio (o
nome é `*.ts.net`, que consta no registro público de certificados); e-mail só no Mailpit local; limites de banda do Funnel,
que não são configuráveis; dependência de um serviço de terceiros (Tailscale); um incidente na máquina do autor é um
incidente da demonstração.

### B — Cloudflare Tunnel nomeado (já existe, Onda 7H)

**A favor:** já está implementado e documentado; suporta domínio próprio.
**Contra:** endereço fixo exige domínio comprado na Cloudflare; o modo rápido, o único sem domínio, muda de endereço a cada
subida e quebra os links dos e-mails.

### C — VPS paga com a mesma imagem do compose (ADR-008, alternativa C)

**A favor:** não depende da máquina do autor ligada; domínio próprio possível; e-mail de verdade.
**Contra:** custo recorrente e administração de servidor (patches, firewall, backup) que o projeto não pode bancar nem
revisar sozinho antes de dezembro.

## Decisão

Adotamos **A** para a demonstração final.

1. **Um único origin público**: a porta do `web` (8090), sempre em `127.0.0.1`. É a única porta que o Funnel expõe.
   O nginx entrega site, `/api/` e `/media/`; o frontend chama a API por caminho relativo.
2. **`compose.demo.yaml`**, camada sobre o `compose.yaml`: `restart: unless-stopped`; volumes nomeados; nenhuma porta de
   banco ou de API no host; Mailpit só em `127.0.0.1` e nunca no Funnel; API em `Production`.
3. **Domínio por variável** (`PUBLIC_ORIGIN`), nunca no código. CORS e base dos links dos e-mails leem dela; a CSP do
   nginx é `'self'` e não carrega domínio.
4. **Proxy confiável mínimo**: só a sub-rede fixa do compose (`DEMO_SUBNET`, 172.28.0.0/24), em vez das três faixas
   privadas inteiras do `compose.yaml`. `UseForwardedHeaders` continua antes do limitador.
5. **Aviso visível** "Ambiente de demonstração — dados fictícios" em toda tela, por variável de build (`DEMO_BANNER`).
   > **Atualização de 11/11/2026 (decisão do Arthur):** o padrão passou a ser **sem faixa** (`DEMO_BANNER` vazio). O
   > componente e a variável continuam: para voltar a ter o aviso, defina `DEMO_BANNER` no `.env` e reconstrua o `web`.
   > Sem a faixa, nada na tela avisa quem abre o link de que os dados e os e-mails são fictícios; essa informação passa a
   > depender de quem apresenta.
6. **Operação documentada** em `docs/operacao/publicacao-demo.md`: abrir, derrubar (`tailscale funnel reset`) e restaurar
   (`down -v`, `up`, seed).

**Revisão humana obrigatória antes de aceitar** (CLAUDE.md §4.2): autenticação (rotação da chave JWT, senhas do seed),
CORS e CSP, cabeçalhos encaminhados (a sub-rede de confiança e o que o Funnel de fato envia), e migration (**nenhuma**
foi criada ou aplicada por esta decisão).

## Consequências

### O que fica mais fácil

Endereço estável e gratuito para a banca; um único comando derruba tudo (`funnel reset`); a mesma pilha de desenvolvimento
roda a demonstração, então o que a banca vê é o que foi testado.

### O que fica mais difícil

- A demonstração morre com a máquina: suspensão, atualização do Windows, queda de energia ou de internet.
- Não há domínio próprio nem e-mail de verdade: cadastro novo não recebe confirmação, e a conta só entra pelo seed ou pelo
  Mailpit local.
- O limite de banda do Funnel pode degradar a experiência com muita gente ao mesmo tempo, e não dá para ajustá-lo.
- A confiança no cabeçalho `X-Forwarded-For` depende de como o Funnel o monta: se ele não o enviar, o limitador de força bruta
  (10 por minuto) vira um só para todos. **Não verificado.**
- A sub-rede fixa pode colidir com outra rede do Docker da máquina.

### O que passa a ser proibido

Publicar banco, API ou Mailpit no Funnel (ou em qualquer interface além de `127.0.0.1`); escrever o domínio, senha ou chave
no repositório; aceitar `X-Forwarded-For` de qualquer origem; usar esta demonstração como evidência de uso, métrica ou
resultado no TCC (os dados são fictícios).

## Como saber que erramos

- Se `tailscale funnel status` mostrar mais de uma porta, ou uma porta que não seja a do `web`.
- Se, com o Funnel ligado, todo visitante tomar `429` no login (o limitador vê um só IP).
- Se a banca não conseguir abrir o endereço por queda da máquina em uma sessão real: migrar para C.
- Se o limite de banda travar a carga das fotos com a banca conectada.

## Referências

- ADR-008 (hospedagem), ADR-035 (PWA), `docs/operacao/demo-publica.md` (Cloudflare), `docs/operacao/publicacao-demo.md`.
- Nenhuma fonte externa foi consultada para esta decisão: o comportamento do Funnel (cabeçalhos, banda) está listado como
  **não verificado** e precisa ser conferido com ele ligado.
