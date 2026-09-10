# Decisões de Produto — Blocos 1 e 2

> Documento de definição. Fase: descoberta.
> Data: 2026-09-03 · Status: **fechado** (não reabrir sem motivo novo)
> Destino: `docs/produto/decisoes-blocos-1-2.md`

---

## 0. Glossário canônico

A palavra **"cliente"** está banida deste projeto. É ambígua nos dois sentidos e já causou inversão de significado na documentação anterior.

| Português | Código (inglês) | Definição |
|---|---|---|
| Empresa | `Business` | O estabelecimento. É o **tenant** do sistema |
| Proprietário | `Owner` | Papel de administração da empresa |
| Profissional | `Professional` | Papel de execução do serviço |
| Consumidor | `Customer` | Quem agenda. Conta global, fora do tenant |
| Serviço | `Service` | Item do catálogo da empresa: nome, duração, preço |
| Agendamento | `Appointment` | Um horário reservado |
| Disponibilidade | `Availability` | Jornada e exceções de um profissional |

---

## 1. Núcleo e proposta de valor

| # | Decisão | Justificativa |
|---|---|---|
| 1.1 | **Dois lados**: `Business` (contratante) e `Customer` (usuário final). Modelo iFood | Ambos são clientes do negócio; a plataforma é intermediária |
| 1.2 | **Plataforma de gestão + vitrine de descoberta**. Não é só agenda nem só marketplace | Gestão entrega valor com um único tenant; descoberta é o diferencial |
| 1.3 | **Beleza/bem-estar** como vertical funcional + **1 tenant de saúde** de exemplo com tratamento LGPD implementado | Ganha o capítulo de conformidade sem pagar o custo em todas as telas |
| 1.4 | Consumidor chega por **busca na plataforma** e por **link direto** divulgado pela empresa | Link funciona com zero tráfego; busca precisa de catálogo |
| 1.5 | Consumidor **precisa de conta** | Histórico multi-serviço é o núcleo da proposta |
| 1.6 | **Empresa com N profissionais** desde o início | Autônomo é o caso N=1 |
| 1.7 | **Apenas presencial** no estabelecimento | Domicílio exige raio e tempo de trânsito; online exige vídeo |
| 1.8 | **Pagamento fora do MVP.** Só a porta `IPaymentGateway`. No-show é marcação manual, sem consequência automática | Decisão 8 do PROJECT-CONTEXT |

### 1.9 Receita e financeiro na interface

O sistema **nunca processa dinheiro**. O dashboard exibe **receita prevista** (`predictedRevenue`), calculada pela soma dos preços dos agendamentos concluídos. O rótulo na tela deve dizer "prevista" ou "estimada" — nunca "faturamento" ou "lucro".

---

## 2. Atores, papéis e identidade

| # | Decisão |
|---|---|
| 2.1 | **Profissional faz login**, com escopo mínimo: vê a própria agenda, marca concluído e no-show. Não edita catálogo, não vê financeiro, não cadastra ninguém |
| 2.2 | `Owner` e `Professional` são **papéis, não tipos de conta**. Uma pessoa pode acumular os dois |
| 2.3 | Profissional pertence a **uma única empresa** no MVP |
| 2.4 | Conta de consumidor **obrigatória** para agendar |
| 2.5 | Conta de consumidor é **global** na plataforma. Vive fora do tenant; a relação com cada empresa é derivada dos agendamentos |
| 2.6 | Consumidor **cancela** até X horas antes (X configurável por empresa). Remarcar = cancelar + novo agendamento. Empresa cancela sempre |
| 2.7 | Perfil do profissional é **público**, com consentimento registrado. Campos de experiência e formação são opcionais |
| 2.8 | Escolha de profissional é **opcional**. Padrão: "sem preferência" |
| 2.9 | **Verticais:** beleza + 1 tenant saúde. **Modalidade:** presencial |
| 2.10 | **Avaliação:** só quem teve agendamento concluído. Nota + texto. Avalia o **estabelecimento**. Empresa pode responder. Sem edição após envio |
| 2.11 | **Busca flexível** — ver §3 |
| 2.12 | "Agendify" e "Agendeaki" são **placeholders**. Naming pendente |

---

## 3. Busca

Requisito: a busca deve ser o mais flexível possível. Dimensões suportadas:

| Dimensão | Comportamento |
|---|---|
| Serviço | Texto livre sobre o catálogo de todas as empresas |
| Estabelecimento | Nome comercial |
| Profissional | Nome |
| Localização | Raio de 5 km / 10 km ou seleção de cidade/bairro |
| **Disponibilidade + serviço** | "Quem faz corte de cabelo amanhã de manhã" |

**Implementação geográfica:** PostGIS, `ST_DWithin` com índice GiST sobre `geography(Point, 4326)`. Condiciona a escolha de host — a extensão precisa estar disponível.

**Alerta de custo — busca por disponibilidade.** É a dimensão mais cara: exige calcular slots livres de todos os profissionais candidatos antes de retornar resultados. Não é uma query, é um cálculo. Mitigações previstas: filtrar geograficamente **antes** de calcular slots, limitar a janela a 7 dias e paginar. Se não couber no orçamento de tempo, esta dimensão é a primeira a ser cortada — as outras quatro entregam a maior parte do valor.

---

## 4. Fora do MVP

Cortado com justificativa. Vira "trabalho futuro" no texto do TCC.

| Item | Motivo |
|---|---|
| Gestão de estoque | Módulo independente, sem relação com o núcleo. Substituído por nota de insumos em texto livre no `Service` |
| Convênio com lógica | Domínio inteiro (operadora, plano, autorização, coparticipação). Vira **campo booleano informativo** na vitrine |
| Promoções e cupons | Módulo de desconto com vigência e regra de aplicação |
| Split de pagamento, Pix, carteira, take-rate, taxa de conveniência, caução anti-no-show | Decisão 8. Vive apenas no capítulo de modelo de negócio |
| Planos Base / Pro / Enterprise com preço | Preço sem pesquisa de mercado não sustenta arguição |
| Recomendação por IA | Sem base histórica, sem tempo |
| Notificação por WhatsApp | Business API tem custo e aprovação da Meta em semanas. MVP: **e-mail + notificação in-app** |
| Programa de indicação | Trabalho futuro |
| Categorias além de beleza e saúde (Pets, Esportes, Educação, Casa) | Cada vertical tem regra própria |
| Profissional em múltiplas empresas | Quebra isolamento do tenant |
| Recursos compartilhados (sala, cadeira, equipamento) | Complexidade de alocação |
| Atendimento domiciliar e online | §1.7 |

---

## 5. Correções sobre material anterior

| Origem | O que dizia | Correção |
|---|---|---|
| Protótipo Gemini | 6 categorias | Duas verticais (§1.3) |
| Protótipo Gemini | `acceptsInsurance` funcional | Campo informativo (§4) |
| Documento Gemini | RNF-04 cita "prontuários" | **Nunca haverá prontuário.** Decisão 9 do PROJECT-CONTEXT |
| Documento Gemini | RNF-02: uptime ≥ 99,8%/mês | Número inventado. RNFs serão reescritos com metas medíveis na demonstração |
| Documento Gemini | Anti-double-booking via lock em Redis | **Rejeitado.** Ver §6 |
| Documento Gemini | Inspiração visual no iFood | Inspiração **estrutural** apenas (cards, categorias, poucos passos). Identidade visual será própria |
| Protótipos (ambos) | Horários disponíveis hardcoded | Não existe modelo de disponibilidade em nenhum dos dois. É o Bloco 3 |

---

## 6. ADR-005 (a escrever) — Prevenção de dupla reserva

**Problema:** dois consumidores selecionando o mesmo horário simultaneamente, ou conflito entre o canal online e a marcação de balcão.

**Proposta rejeitada:** lock distribuído em Redis com chave `lock:slot:{professionalId}:{data}:{hora}` e TTL de 300 s.

**Motivos da rejeição:**
1. Adiciona um serviço a operar, com orçamento próximo de zero.
2. **Não garante integridade.** Se o Redis reiniciar, ou o TTL expirar entre a checagem e a gravação, a dupla reserva ocorre mesmo assim. Lock sem constraint no banco é otimização, não garantia.

**Decisão:** restrição de exclusão no PostgreSQL.

```
EXCLUDE USING gist (professional_id WITH =, period WITH &&)
  WHERE (status <> 'cancelled')
```

O banco rejeita a sobreposição dentro da transação. Zero infraestrutura extra. A comparação entre as duas abordagens vira seção do TCC.

---

## 7. Estratégia de entrada (para o capítulo de negócio)

**"Cavalo de Troia":** oferecer o painel de gestão gratuitamente a estabelecimentos de uma região delimitada, cadastrando oferta e horários **antes** de abrir a plataforma ao consumidor. É a única resposta séria ao problema clássico de liquidez de marketplace (nenhum consumidor sem oferta, nenhuma oferta sem consumidor).

Não é implementável no recorte do TCC — é **argumento de viabilidade**, e como tal entra no texto, não no código.

---

## 8. Pendências abertas após este documento

| # | Pendência | Bloqueia |
|---|---|---|
| A | Nome definitivo da marca | Repositório, skills, design system |
| D | Eixo de marca: paleta, tipografia, símbolo | Tokens e telas |
| — | **Bloco 3: regras do agendamento** | Toda a fatia vertical |
| — | Bloco 4: recorte final do MVP em lista in/out | Milestones e telas do Figma |
| — | Bloco 5: estratégia de multi-tenancy | Modelo de dados |
| — | Bloco 7: método de evidência e limiares do TCC | Coleta em outubro |
| F | Comitê de Ética — a FATEC exige? | Qualquer coleta com participantes |
