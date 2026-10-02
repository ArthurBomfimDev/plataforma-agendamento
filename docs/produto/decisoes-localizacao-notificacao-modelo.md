# Decisões — modelo, localização, identidade e notificação

> Fechado em 22/09/2026. Complementa `docs/produto/modelo-de-dominio.md` e corrige pontos das ADRs citadas.
> **Obrigatório ler antes de escrever código de domínio, busca, cadastro ou notificação.**
> Origem: revisão do modelo de domínio (sessão Cowork, 18–22/09).

---

## 1. Correções no modelo de domínio

| # | Decisão | Muda |
|---|---|---|
| 1 | São **18 entidades**, não 17 — a tabela do §1 está certa, o cabeçalho estava errado | `modelo-de-dominio.md` §1 |
| 2 | Ocupam o slot: `Pending`, `Confirmed`, `Completed`, `NoShow`. Liberam: `Cancelled`, `Rejected`, `Expired` | ADR-005, `backend-architecture-prompt.md` |
| 3 | `Appointment` guarda horário de atendimento (`StartsAt`/`EndsAt`) + buffers como snapshot; intervalo bloqueado é **coluna gerada**, só para a constraint | `modelo-de-dominio.md` §8 |
| 4 | `Professional` pendura em `BusinessId`, com `BusinessMembershipId` **nullable** | `modelo-de-dominio.md` §5 |
| 5 | `Customer` ganha `Id` próprio (Guid v7) + `UserId` como FK única | `modelo-de-dominio.md` §5 |
| 6 | `Holiday` vira calendário puro sem tenant; `ScheduleException` ganha `BusinessId` (exceção de empresa inteira quando `ProfessionalId` é nulo) | `modelo-de-dominio.md` §7 |
| 7 | `Appointment.CustomerId` nullable + `WalkInName`/`WalkInPhone` para balcão | `modelo-de-dominio.md` §8, decisão 2.4 |
| 8 | Nono módulo `Notifications`, com entidade `Notification` | `modelo-de-dominio.md` §1 |
| 9 | Entidade `UserToken` no Identity (confirmação de e-mail, recuperação de senha, convite) | `modelo-de-dominio.md` §3 |

**Contagem final:** 18 + `Notification` + `UserToken` = 20, **menos `Category`** que virou enum (§4) = **19 entidades de domínio**. Somando a tabela `outbox`, que é infraestrutura e não domínio: **20 tabelas, 9 módulos.**

### 1.1 Constraint de exclusão — texto definitivo

```sql
blocked_range tstzrange GENERATED ALWAYS AS (
  tstzrange(starts_at - make_interval(mins => buffer_before_minutes),
            ends_at   + make_interval(mins => buffer_after_minutes), '[)')
) STORED

ALTER TABLE scheduling.appointment ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (professional_id WITH =, blocked_range WITH &&)
  WHERE (status IN ('Pending', 'Confirmed', 'Completed', 'NoShow'));
```

`btree_gist` entra na primeira migration. Violação vira erro de domínio → **HTTP 409** com horários alternativos, nunca 500.

⚠️ Os nomes dos estados aparecem no `WHERE`. Renomear no C# sem migration correspondente desliga a trava em silêncio.

---

## 2. Identidade

### 2.0 Conta única confirmada

`User` única para todos. **Não separar** consumidor e funcionário em contas distintas.

Motivo: e-mail precisa ser único para login, e duas tabelas não garantem isso com um índice único. O caso real que quebra a alternativa: profissional que também consome em outro estabelecimento — comum na vertical de beleza.

A separação já existe no nível certo: `User` = credencial, `Customer` = perfil de consumo, `Professional` = perfil de execução.

**Requisito de interface decorrente:** troca de contexto explícita na tela (seletor "consumidor" / "painel do Salão X"), modelo iFood. Sem isso a experiência fica confusa. O token carrega o contexto ativo.

### 2.1 Idade mínima — 18 anos, sem exceção

**Cadastro exige 18 anos completos.** O agendamento para menor é feito pela conta de um adulto.

Três motivos:

1. **Tira o Art. 14 do escopo.** A plataforma não trata dados de menores — frase limpa e verdadeira no capítulo de conformidade, sem máquina de consentimento de responsável, que não haveria como construir nem testar em 10 semanas.
2. **Atende o caso real.** A mãe agenda o corte do filho pela conta dela, que é o que já acontece hoje.
3. **Custa quase nada no modelo.** O campo "atendimento para outra pessoa" reaproveita `WalkInName`/`WalkInPhone` da marcação de balcão (§1, decisão 7). Uma invariante a mais, coluna nenhuma.

**Limitação a registrar no TCC:** o adolescente que quer agendar sozinho no próprio celular não consegue. Justificativa: a alternativa exige consentimento verificável de responsável, fora do recorte.

⚠️ Não somos advogados. Confirmar o recorte etário com a orientadora, junto da pergunta do Comitê de Ética.

### 2.2 CPF e verificação de identidade

**`Customer.Cpf` é nullable e nunca pedido no cadastro.** Obrigatório apenas no agendamento de categoria sensível, onde a clínica precisa identificar o paciente — finalidade clínica, não antifraude. Criptografado em repouso, nunca em página pública nem em índice de busca.

**Por que não coletar de todo mundo.** Discutimos o modelo da Uber, que pede CPF + data de nascimento e **valida contra a base do governo**, rejeitando CPF gerado — aplicado principalmente a quem paga em dinheiro, ou seja, a quem não tem cartão como âncora de identidade. Duas conclusões:

- **O que funciona é a validação, não o campo.** CPF guardado sem consulta à Receita não previne nada: o dígito verificador é público, gerador de CPF válido é trivial, e CPF real de terceiro circula em vazamento. Campo não verificado = toda a responsabilidade de guardar o identificador mais sensível do país, nenhuma das proteções.
- **Consultar a Receita custa por consulta**, e o projeto já decidiu não fazer isso nem para validar CNPJ de empresa (verificação manual, offline, formato + dígito). Validar o consumidor e não o estabelecimento inverteria a prioridade.

**Sobre a ausência de cartão.** Ela é consequência da decisão 8 (pagamento fora do MVP), não característica permanente do produto. Isso reforça o adiamento em vez de enfraquecê-lo: a janela sem cartão **e** sem CPF verificado é exatamente a janela do MVP, que não tem tráfego real — são 30 empresas semeadas numa demonstração controlada. Quando o pagamento entrar, logo após o MVP, o cartão passa a ser a âncora e a necessidade cai. Construir verificação paga agora seria construir para uma janela que fecha sozinha.

**Porta desenhada, adaptador não construído:** `IIdentityVerificationProvider`, mesmo padrão de `IPaymentGateway` e `IGeocodingProvider`. O capítulo de trabalhos futuros descreve a verificação via base da Receita citando o modelo da Uber, com a justificativa de custo por consulta.

### 2.3 Antifraude no MVP — o que de fato entra

A fraude possível aqui é no-show, bloqueio de agenda por conta falsa e fuga de banimento. Não há fraude de pagamento, porque não há pagamento. Controles, do mais barato ao mais caro:

| Controle | Situação |
|---|---|
| **Aprovação manual como padrão** | Já decidido — sozinho já mata bloqueio de agenda por conta falsa |
| **Antecedência mínima** (`MinLeadTimeHours`) | Já decidido |
| **Histórico de no-show** por consumidor | Dado já existe em `AppointmentEvent` — falta só a tela |
| **Telefone verificado por código** (OTP) | **Âncora de identidade recomendada.** Número em massa custa dinheiro; e-mail não custa nada. Porta desenhada; envio depende de SMS pago ou WhatsApp (§6.4) |
| CPF validado na Receita | Trabalho futuro (§2.2) |

### 2.4 Campos do `Customer`

| Campo | Tipo | Quando é pedido |
|---|---|---|
| `UserId` | `Guid` (FK única) | Cadastro |
| `BirthDate` | `DateOnly` | **Cadastro** — sustenta a regra dos 18 e acompanharia o CPF numa verificação futura |
| `SocialName` | `string?` | Perfil, opcional — a interface exibe ele sempre que existir |
| `Cpf` | `string?` (cifrado) | Só no 1º agendamento de categoria sensível |
| `PhotoUrl` | `string?` | Perfil, opcional |
| `DefaultLocation` | `GeoPoint?` | Se a pessoa salvar (§5.5) |
| `PreferredCity` | `string?` | Se a pessoa salvar (§5.5) |

Sobre `SocialName`: num produto de beleza, chamar a pessoa pelo nome errado no balcão é falha concreta. Custa uma coluna nullable. Se não quiserem, é uma linha a remover.

---

## 3. Reputação e perfil público

**Avaliação do profissional** (reabre decisão 2.10 — atualizar ADR):

- `Review` ganha `ProfessionalRating` (`Rating?`, opcional). Continua **uma avaliação por agendamento**.
- `Professional` ganha `AverageRating` e `ReviewCount` desnormalizados.
- Avaliação por par serviço×profissional: **fora de escopo**, trabalho futuro. Motivo: escassez — quase todo par teria 0 ou 1 avaliação, e "5,0 ★ (1)" lê como inventado.

**Perfil público — campo dividido** (corrige decisão 2.7):

- `DisplayName` é **sempre público**. O consumidor precisa saber quem vai atendê-lo, e o nome já aparece no agendamento.
- `IsPubliclyVisible` passa a significar "perfil completo visível" (foto, bio, experiência, certificações) e **exige** `PublicProfileConsentAt`.

Motivo jurídico: obrigar funcionário a publicar a própria imagem como condição de trabalho produz consentimento inválido sob a LGPD — consentimento em relação de emprego não é livre. Rende parágrafo no capítulo de conformidade.

---

## 4. Categoria como enum

`Category` deixa de ser tabela e vira **enum em código**.

Motivo principal: `RequiresSensitiveHandling` é chave jurídica. Como enum, ninguém desliga o regime do Art. 11 de uma vertical inteira com um `UPDATE`.

Secundário: some uma tabela, um join e uma migration; são 2 valores no MVP (`Beleza`, `Saude`).

**Vira tabela quando:** aparecer subcategoria (Barbearia / Salão / Estética dentro de Beleza), ou quando a empresa puder propor categoria.

---

## 5. Localização e geocodificação

### 5.1 Princípio

**O pino no mapa é o plano A, não o fallback.** O geocodificador dá o palpite; o dono confirma. Tratar a confirmação como exceção produz estabelecimento a centenas de metros do lugar certo, descoberto só por reclamação.

### 5.2 Campos novos em `Business`

| Campo | Tipo | Para quê |
|---|---|---|
| `Location` | `geography(Point, 4326)` | Já previsto |
| `LocationPrecision` | enum: `Rooftop`, `Street`, `Locality`, `City` | Ponto com precisão de cidade não pode exibir "a 200 m" |
| `LocationSource` | `string` | Provedor + versão que gerou o ponto |
| `GeocodedAt` | `DateTimeOffset` | |
| `LocationConfirmedAt` | `DateTimeOffset?` | Quando o dono confirmou o pino |

**Regra:** só entra na busca por raio quem tem `LocationConfirmedAt` preenchido. O checklist de ativação passa de "endereço geocodificável" para **"endereço com ponto confirmado pelo dono"**.

### 5.3 Porta e provedores

`IGeocodingProvider` com `Geocode`, `ReverseGeocode`, `Autocomplete`. Mesmo padrão de `IPaymentGateway`. Trocar provedor é configuração; o domínio não sabe qual é.

| Fase | Provedor |
|---|---|
| TCC / dev | **Nominatim próprio** com extrato do Brasil (sem limite, sem política de uso, sem chave) — ou a API pública, que segura 30 empresas semeadas |
| Produção | Provedor pago com SLA e precisão de telhado no Brasil — avaliar **Azure Maps** (crédito Azure for Students, pendência I) |

API pública do Nominatim: 1 req/s, User-Agent identificando a aplicação, cache obrigatório do lado do cliente, autocomplete proibido.

### 5.4 Fluxo de onboarding

```
CEP → ViaCEP/BrasilAPI preenche endereço → geocodifica → pino no mapa
    → dono confirma ou arrasta → salva com precisão, origem e confirmação
```

- Resultado cacheado por string de endereço: economiza cota, deixa o teste determinístico.
- Mudança de endereço **obriga** nova geocodificação + nova confirmação. O ponto nunca migra sozinho.
- Tiles do mapa: OSM comunitário tem política própria; produção usa MapLibre + provedor de tiles.

### 5.5 Captura da posição do consumidor

Permissão pedida **no momento em que ela compra algo** — ao tocar em "perto de mim" — com tela de pré-aviso explicando o porquê. No celular só se pergunta uma vez, e negativa é praticamente permanente.

Três estados obrigatórios na tela, nenhum deles beco sem saída:

1. **Permitiu** → usa a coordenada
2. **Negou** → cidade/bairro manual (resolve para centroide)
3. **Falhou ou expirou** → mesma queda

Exibir sempre a referência usada, clicável para trocar: `resultados perto de: Centro, Garça`. O navegador devolve a precisão junto — no desktop via wi-fi pode ser de quilômetros, e usar um ponto ruim em silêncio é pior que perguntar.

Implementação atrás de `useGeolocation()` (regra 5 do empacotamento). Troca para o plugin do Capacitor não encosta em componente nenhum.

**LGPD:** coordenada do consumidor é dado pessoal. Uso transitório, sem log, sem histórico. Só vira dado guardado se a pessoa salvar como referência (`Customer.DefaultLocation`, `PreferredCity`).

### 5.6 Ordem da busca (inalterada, reforçada)

Filtro geográfico com `ST_DWithin` + índice GiST → filtro textual → paginação → **só então** cálculo de slots da página.

⚠️ `ST_DWithin`, nunca `ST_Distance < x` — só o primeiro usa o índice. `ST_Distance` entra depois, sobre o conjunto já filtrado, só para exibir "1,2 km".

---

## 6. Notificações

### 6.1 Lembretes viram configuração

`Business.ReminderOffsetsHours` — lista de inteiros, padrão **`[24, 1]`**.

Adicionar 8h ou 3h vira dado, não deploy. Cada estabelecimento ajusta ao próprio ritmo.

- **24 h** protege a empresa: dá tempo de reocupar o horário se a pessoa desistir.
- **1 h** é o "sai de casa agora" — o mais útil em serviço presencial.
- **3 h** sai do padrão: não serve para planejar o dia nem para sair.

### 6.2 Conteúdo da notificação

`Notification` guarda **`Type` + `AppointmentId` + `ReadAt`**. Não guarda `Title`/`Body` prontos para notificação de agendamento — a tela renderiza na hora, para que correção de endereço ou de instruções apareça em lembrete ainda não lido. `Title`/`Body` só para notificação sem agendamento associado.

A tela renderiza:

- Horário, serviço, profissional e preço — do snapshot do `Appointment`
- Endereço + link de mapa (`https://maps.google.com/?q=lat,lng` — só URL, sem chave de API)
- Botão "Adicionar à agenda" → mesmo `.ics` do e-mail de confirmação, sem OAuth
- **`Business.ArrivalInstructions`** (campo novo, texto livre curto): "Chegue e se aconchegue na sala de espera"

Um campo só, usado na confirmação e nos lembretes. **Não** fazer template por tipo de notificação — vira motor de templates e não vale.

### 6.3 Canais

`INotificationChannel` com implementações `Email` e `InApp` no MVP. WhatsApp é a terceira implementação, não construída.

### 6.4 WhatsApp

**Fora do MVP como integração de produção.** O bloqueio não é preço — desde 07/2025 a cobrança é por mensagem e conversas de serviço são gratuitas desde 11/2024; template de utilidade é gratuito dentro de janela de atendimento aberta. O bloqueio é prazo: verificação de negócio com CNPJ junto à Meta, aprovação de cada template, número fora de WhatsApp pessoal.

**Para a demonstração**, dois caminhos sem verificação:

| Opção | Como | Limites |
|---|---|---|
| **Número de teste da Meta** (preferido) | Painel de desenvolvedor cria conta e número de teste automaticamente, com templates pré-aprovados | Até **5 destinatários** cadastrados — tamanho de uma banca. Código idêntico ao de produção |
| **Sandbox do Twilio** (reserva) | Número compartilhado, destinatário manda `join <código>` | Sessão expira em 3 dias; 1 msg/3 s; trial inclui 100 mensagens. Tem template **Appointment Reminders** pré-aprovado |

⚠️ **Honestidade acadêmica:** o que for demonstrado precisa estar rotulado no texto — "executado em número de teste da Meta, sem verificação de negócio, limitado a cinco destinatários". Apresentado como integração pronta, é afirmação que não se sustenta na arguição.

**Web Push** continua na lista COULD e entrega o mesmo efeito na defesa — notificação chegando no celular do avaliador — de graça, sem intermediário e sem ressalva a fazer.

O mesmo canal serviria para o OTP de telefone (§2.3), o que amarra as duas decisões: se o WhatsApp entrar um dia, ele resolve lembrete e verificação de conta com a mesma integração.

---

## 7. ADRs a corrigir ou escrever

| ADR | Ação |
|---|---|
| ADR-005 | Corrigir o `WHERE` da constraint (§1.1) |
| ADR-004 | Registrar conta única + troca de contexto na interface (§2.0) |
| Nova | **Idade mínima de 18 anos e agendamento para terceiro** (§2.1) |
| Nova | **CPF opcional, verificação de identidade como porta** (§2.2) — inclui a comparação com o modelo da Uber |
| Nova | Avaliação do profissional e perfil público dividido (§3) — reabre decisão 2.10 e 2.7 |
| Nova | Categoria como enum (§4) |
| Nova | Geocodificação: porta, provedor por fase, confirmação pelo dono (§5) |
| ADR-002 | Pendente desde o início — revogação do pitch |
| ADR-008 | Pendente — hospedagem e PostGIS. Agora também precisa cobrir `btree_gist` |
