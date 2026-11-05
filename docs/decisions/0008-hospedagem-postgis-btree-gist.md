# ADR-008 — Hospedagem com PostGIS e `btree_gist`

- **Status:** Proposto — unidade de implantação decidida em 27/10; **provedor final em aberto**
- **Data:** 2026-10-26 · revisada em 2026-10-27 e em 2026-10-31 (Onda 7H)
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** infraestrutura; Tenancy (busca geográfica); Scheduling (constraint de exclusão)
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

**Fato.** O banco depende de duas extensões do PostgreSQL, ambas criadas pelas migrations:

- **PostGIS** — busca por raio com `ST_DWithin` sobre `geography` e índice GiST
  (`BusinessRepository.FindBookableNearbyAsync`).
- **`btree_gist`** — permite a igualdade em `professional_id` dentro da constraint `EXCLUDE USING gist`
  que impede dupla reserva (ADR-005, ADR-017).

Sem qualquer uma das duas, o sistema não sobe: a migration falha. O `CLAUDE.md` §1 e o `PROJECT-CONTEXT.md`
§4 tratam as extensões como **requisito duro de hospedagem**.

**Fato.** Localmente, o ambiente inteiro sobe por Docker Compose (`compose.yaml`: banco `postgis/postgis:17-3.5`,
migrations, API e frontend). As medições de 27/10 (RNF-01, RNF-02, RNF-03) foram feitas nesse ambiente.

**Fato.** A aplicação tem trabalho em segundo plano que roda o tempo todo: hoje o `PendingExpirationWorker` (a cada
minuto); a Onda 5 acrescenta o envio de e-mail e os lembretes. O banco recebe consulta mesmo sem usuário.

**Fato (consultado em 27/10, site da Neon).** A Neon suporta PostGIS (3.5.7 no PG17) e `btree_gist` (1.7). No
plano gratuito, o banco é suspenso após 5 minutos parado, sem como desligar isso, e a cota é de 100 CU-horas
por mês.

**Fato (27/10).** A conta Azure for Students foi criada, com US$ 100 de crédito válidos até 27/10/2027
(pendência I).

**Fato.** Orçamento próximo de zero, com a ordem de preferência do `PROJECT-CONTEXT.md` §14.

## Problema

Onde e como hospedar a demonstração de modo que as duas extensões funcionem, dentro do orçamento, e sem descobrir
a incompatibilidade na véspera da defesa?

## Alternativas consideradas

### A — Banco gerenciado de um provedor (Azure Database for PostgreSQL, ou outro)

**A favor:** backup e manutenção ficam com o provedor.
**Contra:** cada provedor exige o próprio teste das extensões; o ambiente deixa de ser igual ao medido.
⚠️ não verificado: se o crédito de estudante cobre um PostgreSQL gerenciado com as duas extensões.

### B — Banco em camada gratuita (Neon)

**A favor:** as duas extensões são suportadas (fato acima); custo zero.
**Contra:** suspende após 5 minutos parado; os workers manteriam o banco acordado e consumiriam a cota de
CU-horas; quando suspenso, a primeira requisição paga a retomada. A latência de rede até o banco mudaria os
números medidos. **Descartada em 27/10.**

### C — Plataforma de aplicação sem Compose (Heroku e semelhantes)

**A favor:** implantação simples por repositório.
**Contra:** não roda o `compose.yaml`: exigiria separar banco, API e frontend em serviços do provedor, e um banco
com as duas extensões. **Descartada em 27/10.**

### D — Docker Compose como unidade de implantação, em máquina intercambiável

**A favor:** o mesmo `compose.yaml` que já roda e foi medido; as extensões vêm na imagem `postgis/postgis`; trocar
de máquina é repetir a instalação. Serve para uma VPS paga, uma VM com o crédito de estudante ou uma máquina
própria.
**Contra:** manutenção, backup e TLS passam a ser do projeto; numa máquina própria, a disponibilidade depende de
energia, internet e do sistema operacional da casa.

## Decisão

Adotamos **D**.

- **Unidade de implantação:** Docker Compose. PostgreSQL com PostGIS e `btree_gist` **em contêiner**, junto da API
  e do frontend.
- **Máquina intercambiável:** VPS paga ou VM no crédito de estudante; em último caso, a máquina do Arthur, exposta
  por **Cloudflare Tunnel** (sem abrir porta no roteador).
- **Neon descartado** (suspensão por ociosidade com workers sempre ativos). **Heroku descartado** (não roda Compose).
- **Provedor final: em aberto** (premissa abaixo). A escolha entra nesta ADR antes de ela passar a `Aceito`.

Critérios que a máquina escolhida precisa cumprir, nesta ordem:

1. O `docker compose up --build` sobe e as migrations aplicam sem erro, incluindo `appointment_no_overlap`.
2. `Booking.IntegrationTests` passa apontando para o banco dessa máquina (caminho `ConnectionStrings__Default`).
3. HTTPS público, com os cuidados de exposição (ver Consequências).
4. Custo dentro do orçamento até dezembro de 2026.

## Consequências

### O que fica mais fácil

- O ambiente da demonstração é o ambiente medido: os números de `docs/tcc/evidencias/` continuam válidos para ele,
  respeitadas as limitações já declaradas (máquina diferente, rede diferente).
- Trocar de provedor é configuração, não refatoração.

### O que fica mais difícil

- Backup do banco, atualização de imagem e certificado TLS são do projeto.
- Antes de expor qualquer máquina na internet, é preciso: trocar as senhas de demonstração do seed (o Admin
  `admin@example.com` tem senha conhecida); subir a API em `Production`; configurar `UseForwardedHeaders` (atrás de
  túnel ou proxy, o limitador de login veria um IP só); reconstruir o frontend com a URL pública e ajustar o CORS.
- Numa máquina própria, a disponibilidade não tem garantia (o Docker Desktop caiu quatro vezes numa sessão de 27/10).

### O que passa a ser proibido

- Trocar PostGIS ou `btree_gist` por alternativa na aplicação (distância calculada em C#, checagem de sobreposição em
  código) para caber em um provedor. Isso desfaria a garantia da ADR-005.

## Premissa não verificada

**Existe uma máquina, dentro do orçamento, que cumpre os quatro critérios até a defesa.** Nenhuma foi testada ainda.
O crédito de estudante é o candidato natural; o tamanho de VM que ele paga até dezembro e as regiões permitidas não
foram conferidos (⚠️ não verificado).

### Revisão de 31/10 (Onda 7H) — o caminho da máquina própria existe

**Fato.** A lista "antes de expor qualquer máquina" de Consequências foi implementada, e o caminho de última
instância (máquina do Arthur + Cloudflare Tunnel) foi exercitado numa pilha isolada, com o túnel rápido
(`trycloudflare.com`):

- senha do seed: `SEED_PASSWORD` e `SEED_ADMIN_PASSWORD`; fora de Development o seed recusa a senha padrão, e o Admin
  sem senha definida ganha uma aleatória;
- API em `Production` na demonstração, recusando a chave JWT de exemplo;
- `UseForwardedHeaders` com as redes confiáveis configuráveis (o limitador conta o IP real);
- **uma origem só**: o nginx repassa `/api/` e `/media/`, o frontend chama a API por caminho relativo. Não é mais
  preciso reconstruir o frontend com a URL pública nem ajustar o CORS — o item da lista ficou obsoleto.

Guia: `docs/operacao/demo-publica.md`.

**Interpretação.** Isso cumpre os critérios 1 e 3 **para a máquina do Arthur**, e só para ela. Não fecha a premissa:
a disponibilidade dessa máquina continua sem garantia (ver Consequências), o critério 2 não foi rodado contra ela
como alvo de implantação, e o túnel rápido muda de endereço a cada subida. A ADR **continua Proposto**: o provedor
final segue em aberto.

## Como saber que erramos

- Se a máquina escolhida não aguentar a pilha inteira (API, banco e frontend) com a carga das evidências.
- Se a disponibilidade da máquina falhar numa sessão de avaliação com participantes.

## Referências

- ADR-001 — stack · ADR-005 — constraint de exclusão · ADR-017 — intervalo bloqueado em colunas gravadas · ADR-019 —
  fila por profissional
- `compose.yaml` · `.github/workflows/backend-ci.yml`
- Neon: <https://neon.com/docs/extensions/pg-extensions> e <https://neon.com/docs/introduction/plans> (consultados em
  27/10/2026)
- `PROJECT-CONTEXT.md` §4 (decisão 4), §11 (pendências G e I), §14 (orçamento)
