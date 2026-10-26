# Documento Geral do Projeto

> Plataforma de descoberta e agendamento de serviços — Trabalho de Conclusão de Curso
> FATEC Garça · Análise e Desenvolvimento de Sistemas · Defesa em dezembro de 2026
> Autores: Arthur Bomfim e Rafael Ernandes · Orientadora: Prof.ª Dr.ª Cláudia Maria Bernava Aguillar
> Versão de 26/10/2026 (anterior: 28/09/2026) · Repositório: `github.com/ArthurBomfimDev/plataforma-agendamento`
> Marca do produto: **Vagoo** · O repositório e o namespace `Booking.*` mantêm nome neutro (pendência K)

Este documento reúne, em um só lugar, o que o sistema é, por que ele existe, como está modelado, como será construído e como será avaliado. Ele substitui a leitura dos documentos parciais para quem precisa entender o projeto inteiro.

---

## 1. O problema

Agendar um serviço presencial no Brasil continua sendo uma tarefa desproporcionalmente trabalhosa, e a dificuldade se espalha por quatro momentos distintos.

A **descoberta é fragmentada**: quem procura um profissional alterna entre busca no Google, perfis no Instagram, indicações em grupos de mensagem e o boca a boca. Não existe um lugar único onde comparar quem faz o quê, por quanto e em qual horário.

A **confiança é incerta**: as avaliações estão espalhadas entre plataformas que não foram feitas para isso, sem vínculo com um atendimento que de fato aconteceu. Não há como distinguir a opinião de quem foi atendido da de quem nunca foi.

A **logística é arcaica**: marcar exige ligação em horário comercial ou uma troca demorada de mensagens, com espera por resposta e idas e vindas até encontrar um horário que sirva para os dois lados.

E o **controle é inexistente**: depois de marcado, cada compromisso vive isolado no canal onde foi combinado. Não há um lugar para consultar, remarcar ou cancelar.

Do lado de quem presta o serviço, o mesmo processo aparece como custo: a gestão da agenda consome tempo de atendimento, chamadas não atendidas viram receita perdida, e não existe registro estruturado do que foi feito.

---

## 2. A proposta

Uma plataforma de dois lados que junta duas coisas que hoje vivem separadas: uma **ferramenta de gestão** para o estabelecimento — agenda, catálogo, equipe, jornada, indicadores — e uma **vitrine de descoberta** para o consumidor — busca por serviço, localização e disponibilidade, com preço e avaliação à vista.

A referência estrutural é o iFood: dois clientes distintos, marketplace intermediando, poucos passos até a conclusão. A inspiração é de estrutura, não visual — a identidade é própria.

O valor está na junção. A gestão sozinha já serve a um único estabelecimento, mesmo sem nenhum consumidor na plataforma. A descoberta é o que transforma a ferramenta em mercado.

---

## 3. Escopo

### 3.1 Verticais

Beleza e bem-estar como vertical funcional, mais **um estabelecimento de saúde** de exemplo, com o tratamento de dado sensível implementado de verdade. A escolha permite demonstrar conformidade sem pagar o custo dela em todas as telas.

### 3.2 Modalidade

**Apenas atendimento presencial no estabelecimento.** Atendimento domiciliar exigiria raio de deslocamento e tempo de trânsito; atendimento online exigiria infraestrutura de vídeo. Ambos ficam fora.

### 3.3 O que está fora do MVP, e por quê

| Item | Motivo do corte |
|---|---|
| Pagamento, Pix, split, carteira, caução | O sistema nunca processa dinheiro. Existe apenas a porta `IPaymentGateway`, sem implementação |
| Gestão de estoque | Módulo independente do núcleo. Substituído por uma nota de insumos em texto livre no serviço |
| Convênio com lógica | Domínio inteiro (operadora, plano, autorização). Vira campo booleano informativo |
| Promoções e cupons | Módulo de desconto com vigência e regra de aplicação |
| Recomendação por IA | Exige base histórica que não existirá |
| Notificação por WhatsApp | Verificação de negócio junto à Meta leva semanas. MVP usa e-mail e notificação no app |
| Chat com o estabelecimento | Reintroduz a espera que o produto elimina, e cria dado sensível não estruturado |
| Profissional em múltiplas empresas | Quebra o isolamento entre estabelecimentos |
| Recursos compartilhados (sala, cadeira) | Complexidade de alocação |

Cada corte vira uma seção de trabalhos futuros no texto final, com a justificativa preservada.

---

## 4. Atores e permissões

São quatro atores, e dois deles são **papéis**, não tipos de conta — a mesma pessoa pode acumular os dois.

| Ator | O que é |
|---|---|
| **Consumidor** | Quem agenda. Conta global, válida em qualquer estabelecimento da plataforma |
| **Profissional** | Quem executa o serviço. Pertence a um estabelecimento |
| **Proprietário** | Quem administra o estabelecimento |
| **Administrador** | Quem aprova, verifica e suspende estabelecimentos na plataforma |

| Ação | Consumidor | Profissional | Proprietário | Admin |
|---|---|---|---|---|
| Agendar e cancelar o próprio | ✅ | — | — | — |
| Avaliar atendimento concluído | ✅ | — | — | — |
| Ver a própria agenda | — | ✅ | ✅ | — |
| Ver a agenda de todos | — | ❌ | ✅ | — |
| Aceitar ou recusar pedido | — | ✅ só os seus | ✅ | — |
| Marcar concluído ou falta | — | ✅ só os seus | ✅ | — |
| Marcação de balcão | — | ✅ só a sua agenda | ✅ | — |
| Editar jornada, bloqueios e férias | — | ❌ | ✅ | — |
| Criar e editar serviço e preço | — | ❌ | ✅ | — |
| Convidar e remover colaborador | — | ❌ | ✅ | — |
| Responder avaliação | — | ❌ | ✅ | — |
| Configurar política de agendamento | — | ❌ | ✅ | — |
| Ver relatórios do estabelecimento | — | ✅ só os seus | ✅ | — |
| Aprovar, verificar e suspender empresa | — | — | — | ✅ |

**Idade mínima de 18 anos** para ter conta. O agendamento para menor é feito pela conta de um adulto, com o nome de quem será atendido registrado no próprio agendamento. A decisão remove do escopo o tratamento de dados de crianças e adolescentes, que exigiria consentimento verificável de responsável.

---

## 5. Regras de negócio

### 5.1 Agendamento

| Regra | Valor padrão |
|---|---|
| Granularidade do horário | Por serviço, padrão 15 minutos |
| Jornada | Semanal recorrente, configurada pelo estabelecimento |
| Buffer antes e depois | No serviço, padrão 0 |
| Antecedência mínima | 2 horas, configurável |
| Horizonte de agendamento | 60 dias, configurável |
| Serviços por agendamento | Um. Combo vira um serviço próprio |
| Capacidade | Um atendimento por profissional por vez |
| Confirmação | **Aprovação manual por padrão**, com autoconfirmação configurável |
| Expiração do pedido pendente | 12 horas, ou na antecedência mínima |
| Cancelamento pelo consumidor | Até 24 horas antes, configurável entre 0 e 48 |
| Fuso horário | UTC no banco, fuso IANA por estabelecimento |

### 5.2 Ciclo de vida do agendamento

```
                  ┌──── Rejeitado (empresa recusa)
                  │
Pendente ─────────┼──── Expirado (prazo vencido, pelo sistema)
                  │
                  └──── Confirmado ──┬── Concluído
                                     ├── Falta
                                     └── Cancelado
Pendente ──────────────────────────────── Cancelado (consumidor desiste)
```

Com autoconfirmação ligada, nasce direto em Confirmado. A marcação de balcão nasce sempre em Confirmado.

Quatro estados ocupam o horário: Pendente, Confirmado, Concluído e Falta. Três liberam: Cancelado, Rejeitado e Expirado. Concluído e Falta continuam ocupando porque são passado, e o passado não pode ser sobrescrito por uma marcação retroativa.

### 5.3 Preço e duração congelados

O agendamento guarda uma cópia do preço, da duração, do nome do serviço e dos buffers no momento da criação. Sem isso, um reajuste de tabela reescreveria todo o histórico financeiro retroativamente.

### 5.4 Feriados

Os feriados nacionais são **calculados**, não consultados em serviço externo: os fixos são constantes e os móveis derivam da Páscoa pelo algoritmo de Gauss. Custo zero e sem dependência de terceiros. O padrão é indisponível; o estabelecimento pode abrir. O consumidor vê que a data é feriado de qualquer forma, mesmo quando a empresa abre.

### 5.5 Avaliação

Só de agendamento concluído, uma por agendamento, sem edição após o envio, com prazo de 30 dias. É essa amarração que torna a avaliação verificada. Avalia o estabelecimento, com nota opcional para o profissional. O proprietário pode responder.

### 5.6 Verificação do estabelecimento

Estados: Rascunho → Em análise → Ativo → Suspenso. Para submeter, o estabelecimento precisa de CNPJ ou CPF válido, endereço com ponto confirmado no mapa, ao menos um serviço, um profissional, uma jornada e uma foto. O CNPJ é validado por formato e dígito verificador, offline. A verificação é manual, feita pelo administrador em fontes públicas gratuitas.

---

## 6. Arquitetura

### 6.1 Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript + Vite, mobile-first, PWA |
| Backend | C# / ASP.NET Core (.NET 10) |
| Banco | PostgreSQL + PostGIS |
| Repositório | Monorepo, CODEOWNERS por pasta, GitHub Projects como quadro |

### 6.2 Monólito modular

Um processo, um banco. A escolha não é de conveniência: o núcleo do produto exige **garantia transacional forte** para impedir dupla reserva, e distribuir isso em serviços transformaria a regra mais importante do sistema no problema mais difícil da computação distribuída.

A fronteira entre módulos é verificada por **teste de arquitetura que quebra o build** quando um módulo referencia o tipo interno de outro. É isso que transforma "monólito modular" de intenção em fato verificável — e rende evidência automatizada no texto, mais forte que um diagrama.

Os nove módulos: `Identity`, `Tenancy`, `People`, `Catalog`, `Availability`, `Scheduling`, `Reputation`, `Compliance` e `Notifications`.

### 6.3 Multi-tenancy

Por coluna `BusinessId`, em banco e schema únicos. O motivo é direto: a busca precisa atravessar todos os estabelecimentos no mesmo endpoint público, o que bancos separados por tenant impediriam.

Três camadas de proteção, na ordem em que falham: filtro global do Entity Framework a partir do token; teste de integração que autentica como um estabelecimento e tenta ler recurso de outro por ID direto, exigindo 404; e Row Level Security no PostgreSQL, previsto para depois do MVP.

### 6.4 Organização do backend

```
backend/src/
  Core/
    Booking.Domain/        entidades, objetos de valor, eventos
    Booking.Application/   comandos, consultas, conversores
    Booking.Arguments/     contrato da API
  Infrastructure/
    Booking.Infrastructure/ EF Core, mapeamento, repositórios, outbox
  Presentation/
    Booking.Api/            endpoints
tests/
  UnitTests · IntegrationTests · ArchitectureTests
```

Entidades com máquina de estado ou dados congelados não usam CRUD genérico: um `Update` genérico permitiria pular a máquina de estados, e um `Delete` genérico apagaria o histórico que o congelamento existe para preservar.

---

## 7. Modelo de domínio

São **19 entidades de domínio em 9 módulos**, mais a tabela de fila de eventos, que é infraestrutura — 20 tabelas no total. Quatro raízes de agregado: `Business`, `Customer`, `Appointment` e `User`.

| Módulo | Entidades |
|---|---|
| Identity | `User`, `RefreshToken`, `UserToken` |
| Tenancy | `Business`, `BusinessMembership` |
| People | `Customer`, `Professional` |
| Catalog | `Service`, `ServiceProfessional` |
| Availability | `WorkSchedule`, `ScheduleException`, `Holiday` |
| Scheduling | `Appointment`, `AppointmentEvent` |
| Reputation | `Review`, `ReviewReply` |
| Compliance | `ConsentRecord`, `SensitiveAccessLog` |
| Notifications | `Notification` |

Sete objetos de valor — `Money`, `TimeRange`, `Duration`, `Slot`, `GeoPoint`, `Email`/`PhoneNumber` e `Rating` — e dois serviços de domínio, `AvailabilityCalculator` e `SlotSearch`.

**O horário livre não é dado, é cálculo.** Materializar horários disponíveis em tabela geraria milhões de linhas mortas e um problema de invalidação a cada mudança de jornada. O `Slot` existe apenas dentro da resposta de uma consulta e nunca é persistido.

O `AvailabilityCalculator` é puro e determinístico, sem entrada e saída e sem relógio interno — o instante atual entra como parâmetro. É a peça mais testável e mais crítica do sistema.

Os diagramas de classes, de entidades e de casos de uso estão no arquivo FigJam do projeto, em três páginas separadas.

---

## 8. O problema técnico central: dupla reserva

Dois consumidores selecionam o mesmo horário ao mesmo tempo. Ou o consumidor agenda pelo aplicativo no instante em que a recepção marca alguém no balcão. Sem tratamento, os dois passam.

**A solução rejeitada** foi lock distribuído em Redis. O motivo da rejeição não é custo: é que lock sem garantia no banco é otimização, não garantia. Se o Redis reiniciar, ou o tempo de expiração vencer entre a checagem e a gravação, a dupla reserva acontece mesmo assim.

**A solução adotada** é uma restrição de exclusão no PostgreSQL, sobre o profissional e o intervalo bloqueado. O intervalo bloqueado é o horário do atendimento acrescido dos intervalos de preparo antes e depois definidos no serviço; ele é gravado no próprio agendamento, em duas colunas, no momento da criação:

```sql
-- colunas gravadas pela aplicação
blocked_starts_at timestamptz NOT NULL,   -- início − intervalo antes
blocked_ends_at   timestamptz NOT NULL,   -- início + duração + intervalo depois

CONSTRAINT ck_appointment_blocked_range
  CHECK (blocked_starts_at <= starts_at AND blocked_ends_at >= ends_at)

ALTER TABLE scheduling.appointment
  ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (
    professional_id WITH =,
    tstzrange(blocked_starts_at, blocked_ends_at, '[)') WITH &&
  ) WHERE (status IN ('Pending', 'Confirmed', 'Completed', 'NoShow'));
```

O desenho inicial calculava o intervalo bloqueado em uma coluna gerada pelo próprio banco, a partir do início, do fim e dos intervalos de preparo. Essa forma não pode ser criada: o PostgreSQL só aceita em coluna gerada expressões **imutáveis** — que devolvem sempre o mesmo resultado para os mesmos argumentos —, e a subtração de um intervalo de tempo de um `timestamptz` é apenas **estável**, porque o resultado depende do fuso horário configurado na sessão. A versão implementada desloca o cálculo para a aplicação, que grava os dois limites; a função `tstzrange` sobre dois `timestamptz` é imutável e pode compor o índice GiST da restrição. A restrição de verificação `ck_appointment_blocked_range` impede que um limite gravado fique incoerente com o horário do atendimento, de modo que a mudança de lugar do cálculo não abre uma brecha na garantia (ADR-017).

O banco recusa a sobreposição dentro da transação, inclusive entre canal online e balcão, que era o caso mais difícil. Zero infraestrutura adicional. A violação é capturada e traduzida em erro de domínio, que vira HTTP 409 com horários alternativos — nunca um erro 500.

A comparação entre as duas abordagens, com teste automatizado disparando requisições simultâneas para o mesmo horário e provando que exatamente uma passa, é a evidência técnica mais forte do trabalho.

---

## 9. Busca e geolocalização

A busca aceita cinco dimensões: serviço, estabelecimento, profissional, localização e a combinação de disponibilidade com serviço — "quem faz corte de cabelo amanhã de manhã".

A ordem de execução é obrigatória e não é detalhe de implementação: **filtro geográfico primeiro**, com `ST_DWithin` e índice GiST sobre `geography(Point, 4326)`; depois filtro textual; depois paginação; e **só então** o cálculo de horários livres, apenas sobre a página de resultados. Calcular disponibilidade de duzentos estabelecimentos para exibir vinte gastaria todo o orçamento de tempo em resultado que ninguém vê.

A coordenada do estabelecimento é definida no cadastro e **confirmada pelo dono num mapa**. O geocodificador dá apenas o palpite inicial; tratar a confirmação como exceção produz estabelecimento a centenas de metros do lugar certo. O sistema guarda a precisão do ponto, porque uma coordenada com precisão de cidade não pode ser exibida como "a 200 metros". Só entra na busca por proximidade quem teve o ponto confirmado.

A posição do consumidor é pedida no momento em que ela serve para algo, com tela de explicação antes, e três saídas desenhadas: permitiu, negou e falhou — nenhuma delas um beco sem saída.

---

## 10. Conformidade com a LGPD

O ponto que muda o projeto: **em categoria de saúde, o próprio agendamento já é dado sensível**. Não é preciso haver prontuário — "Fulano marcou fisioterapia na clínica X" é informação referente à saúde de pessoa identificada. Isso vale para consultório pequeno, não só para hospital.

As consequências estão implementadas, não declaradas:

- Consentimento **específico e destacado** para agendamento em categoria sensível, distinto do aceite genérico do cadastro, versionado e revogável. Sem consentimento vigente, a operação é recusada — é bloqueio, não aviso.
- Agendamento de categoria sensível **nunca** aparece em página pública nem em índice de busca.
- Toda leitura desse tipo de agendamento é registrada em log de acesso.
- O perfil público do profissional exige consentimento registrado para foto, biografia e certificações. O nome é sempre público, porque o consumidor precisa saber quem vai atendê-lo. Obrigar um funcionário a publicar a própria imagem como condição de trabalho produziria consentimento inválido.
- O pedido de exclusão anonimiza em vez de apagar, preservando o histórico de agendamento do estabelecimento e limpando os campos livres escritos pelo consumidor.
- A coordenada de localização do consumidor é usada de forma transitória, sem log e sem histórico.

**Nunca haverá prontuário, exame, laudo ou anexo clínico** na plataforma.

---

## 11. Método e avaliação

### 11.1 Método

**Design Science Research.** O artefato é a solução; demonstração e avaliação são etapas formais do método, o que torna a avaliação controlada uma escolha metodológica em vez de uma limitação. *Pendente de aprovação da orientadora, junto da consulta sobre Comitê de Ética.*

### 11.2 Hipóteses

As quatro hipóteses originais do projeto de pesquisa são de mercado e exigiriam tráfego real para serem testadas. Elas passam para o capítulo de limitações e dão lugar a três hipóteses verificáveis na demonstração controlada:

- **H1** — ao menos 85% dos participantes concluem um agendamento sem ajuda, na primeira tentativa.
- **H2** — a média do questionário SUS fica em 68 ou mais.
- **H3** — o prestador configura serviço, profissional e jornada sozinho em menos de 10 minutos.

Os limiares são declarados **antes** da coleta. O roteiro de tarefas é idêntico para todos e escrito antes. Termo de consentimento assinado por todos os participantes.

### 11.3 Requisitos não funcionais medíveis

| ID | Meta | Como é medido |
|---|---|---|
| RNF-01 | Busca com cálculo de horários: p95 ≤ 800 ms, com 30 estabelecimentos semeados | k6 |
| RNF-02 | Cálculo de disponibilidade: p95 ≤ 200 ms | Teste cronometrado |
| RNF-03 | **Zero dupla reserva sob 50 requisições concorrentes** | Teste de integração |
| RNF-04 | Lighthouse mobile ≥ 85 de performance e ≥ 95 de acessibilidade | Integração contínua |
| RNF-05 | Da busca à confirmação em no máximo 4 passos | Contagem |
| RNF-06 | Argon2id, TLS, nenhum dado sensível em página pública | Checklist |

Disponibilidade não entra como requisito: não é mensurável nem garantível em hospedagem gratuita, e um número inventado não se sustenta na arguição.

### 11.4 Dados de demonstração

30 estabelecimentos na mesma cidade com coordenadas reais, duas verticais, três a cinco profissionais cada, jornadas variadas, 60 dias de histórico com avaliações e faltas, e agenda futura parcialmente ocupada. O script é versionado e reexecutável.

---

## 12. Estado atual e recorte de entrega

### 12.1 O que existe hoje

Retrato de 26/10/2026. O detalhe vivo fica no `PROJECT-CONTEXT.md` §2.

| Frente | Situação |
|---|---|
| Definição de produto | Fechada — glossário, atores, regras, cortes |
| Modelo de domínio | Fechado — 19 entidades, 9 módulos, revisado e corrigido |
| Diagramas | Classes, entidades e casos de uso, em FigJam |
| Design | Paleta R5 (marca Vagoo), modos claro e escuro, 11 conjuntos de componentes, 131 variáveis em 4 coleções, cerca de 50 telas em 8 páginas |
| Repositório | Público, `main` protegida por 4 verificações obrigatórias, CI, ADRs |
| Backend | Cerca de 12,7 mil linhas de C#. Sete dos nove módulos implementados: Identity, Tenancy, People, Catalog, Availability, Scheduling e Compliance. Reputation e Notifications não têm código. Três migrations, com PostGIS e `btree_gist`, e a restrição de exclusão real em `scheduling.appointment` (§8) |
| Testes | 28 testes de arquitetura (regras da ADR-010, cada uma provada contra violações plantadas) e 81 casos de teste unitário. **Não há testes de integração**: a prova de concorrência do RNF-03 ainda não existe |
| Frontend | O fluxo do consumidor consome a API real — início, estabelecimento, escolha de profissional, calendário, revisão, pedido enviado, meus agendamentos, entrar e criar conta. Resultados da busca e lembretes ainda usam dado provisório. **Nenhuma tela do lado do estabelecimento** |
| Ambiente | Banco, migrations, API e frontend sobem com Docker Compose; um script popula três estabelecimentos de demonstração |

### 12.2 O recorte proposto

O recorte foi proposto em 28/09, com cerca de seis semanas até a entrega do código. Em 26/10 restam cerca de duas semanas e meia até o prazo de código (segunda semana de novembro), com duas pessoas em tempo parcial e o texto do trabalho na mesma janela. A lista completa de funcionalidades obrigatórias não cabe nesse prazo, e assumir que cabe é o erro mais caro que o projeto poderia cometer agora.

**Entra na entrega:**

1. A fatia vertical completa — cadastro do estabelecimento, serviço, profissional, jornada, cálculo de horários, agendamento pelo consumidor, aprovação pelo estabelecimento e visualização na agenda.
2. A busca pública com filtro geográfico e por disponibilidade.
3. A prova de concorrência do RNF-03, com o teste automatizado.
4. O tratamento de dado sensível da vertical de saúde.
5. Autenticação, cadastro e recuperação de senha.

**Vai para trabalhos futuros, declarado:** avaliações, notificação por e-mail, upload de fotos, PWA instalável, painel de indicadores, painel administrativo de aprovação, e tudo que já estava fora do MVP.

O recorte preserva exatamente a parte do trabalho que sustenta a arguição técnica — a garantia de integridade sob concorrência — e corta o que é largura sem profundidade.

---

## 13. Limitações

- A avaliação é uma **demonstração controlada**, não uso em produção com tráfego real. As hipóteses de mercado não são testadas.
- O número de participantes é pequeno e não permite generalização estatística.
- A verificação de identidade de consumidores não é implementada; o desenho da porta existe, a integração com base oficial não.
- A verificação de estabelecimentos é manual, feita em fontes públicas, sem consulta a base oficial.
- O sistema não processa pagamento, o que remove do escopo toda a cadeia de fraude financeira e conciliação.
- A primária da identidade visual é vizinha cromática de produtos consolidados do mesmo mercado; a diferenciação depende de tipografia, forma e temperatura dos neutros.
- Hospedagem em camada gratuita impõe latência de partida a frio, que não é otimizável dentro do orçamento.
- **A segurança em nível de linha (RLS) do PostgreSQL não foi implementada.** O isolamento entre estabelecimentos depende só do filtro global da camada de acesso a dados (§6.3). Uma consulta escrita fora desse filtro — SQL explícito, por exemplo — não tem uma segunda barreira no banco. A RLS está prevista para depois do MVP.
- O nome **Vagoo** é próximo de **Vagaro**, plataforma de agendamento para salões. ⚠️ não verificado: a pendência L (registrar como risco ou consultar o INPI) não tem decisão, e não houve consulta de marca. O risco afeta o uso comercial depois do TCC, não a avaliação acadêmica.

---

## 14. Artefatos do projeto

| Artefato | Onde |
|---|---|
| Código e documentação | `github.com/ArthurBomfimDev/plataforma-agendamento` |
| Decisões de produto | `docs/produto/decisoes-produto-blocos-1-2.md` |
| Modelo de domínio | `docs/produto/modelo-de-dominio.md` |
| Decisões de modelo, localização, identidade e notificação | `docs/produto/decisoes-localizacao-notificacao-modelo.md` |
| Decisões de arquitetura | `docs/decisions/` |
| Design: eixo, paleta e tipografia | `docs/design/eixo-paleta-tipografia.md` |
| Design: componentes e telas | `docs/design/componentes-e-telas.md` |
| Diagramas de classes, entidades e casos de uso | FigJam — 3 páginas |
| Telas e design system | Figma |

---

## 15. Pendências abertas

| Pendência | Bloqueia | Responsável |
|---|---|---|
| Aprovação do método DSR pela orientadora | Redação do capítulo de metodologia | Orientadora |
| Consulta sobre Comitê de Ética | Coleta com participantes | Orientadora |
| Confirmação do recorte de entrega | Planejamento até a entrega | Orientadora e autores |
| Nome técnico: renomear o repositório e o namespace `Booking.*` para Vagoo, ou manter neutro e registrar (pendência K) | Consistência entre marca e código | Autores |
| Hospedagem com PostGIS e `btree_gist` | Implantação e demonstração | Autores |
