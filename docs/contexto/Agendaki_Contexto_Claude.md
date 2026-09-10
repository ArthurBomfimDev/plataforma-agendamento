# Agendeaki — Contexto Completo do Projeto para Claude
 
> Documento mestre para importar em um Project do Claude.
>
> Este arquivo deve ser tratado como a principal fonte de contexto do produto, da arquitetura, do processo de desenvolvimento, do uso de agentes e da documentação acadêmica do projeto.
 
---
 
# 1. Identidade do Projeto
 
## Nome
 
**Agendeaki**
 
## Tipo de produto
 
Plataforma SaaS de marketplace de serviços com descoberta, comparação, agendamento e gestão.
 
## Visão resumida
 
O Agendeaki é uma plataforma digital web e mobile que conecta consumidores a profissionais e empresas prestadoras de serviços.
 
A proposta é funcionar como um ecossistema centralizado para serviços do dia a dia, permitindo que o usuário:
 
- encontre profissionais;
- compare preços;
- consulte avaliações;
- veja horários disponíveis;
- agende serviços;
- reagende;
- cancele;
- acompanhe o histórico;
- realize pagamentos;
- receba recomendações personalizadas.
Para o prestador, a plataforma funciona como:
 
- vitrine digital;
- agenda;
- CRM simplificado;
- sistema de gestão de equipe;
- canal de aquisição;
- sistema de relacionamento com clientes;
- base para pagamentos e recebimentos.
O produto pode ser compreendido como uma combinação de referências de experiência e modelo de negócio inspiradas em:
 
- iFood;
- Airbnb;
- Uber;
- Google Maps;
- Booking;
- Calendly.
Essas referências devem servir para análise de padrões, nunca para cópia visual ou estrutural.
 
---
 
# 2. Tema
 
O presente projeto tem como tema o desenvolvimento de uma plataforma digital, web e mobile, que atua como um ecossistema unificado para serviços do dia a dia.
 
A plataforma deve permitir que qualquer pessoa descubra, compare e agende diferentes tipos de serviço com confiança e simplicidade.
 
Exemplos:
 
- corte de cabelo;
- manicure;
- consulta odontológica;
- fisioterapia;
- banho e tosa;
- aulas particulares;
- serviços domésticos;
- bem-estar;
- beleza;
- saúde;
- serviços para pets.
O ponto central do produto é o **agendamento unificado de serviços**.
 
---
 
# 3. Problema
 
O processo atual de agendamento é fragmentado e ineficiente.
 
## 3.1 Descoberta fragmentada
 
O consumidor busca serviços em múltiplos canais:
 
- Google;
- Instagram;
- WhatsApp;
- grupos;
- recomendações;
- anúncios;
- redes sociais.
Não existe uma experiência única que reúna descoberta, comparação e agendamento.
 
## 3.2 Crise de confiança
 
As avaliações podem estar dispersas, desatualizadas ou pouco confiáveis.
 
O consumidor tem dificuldade para avaliar:
 
- qualidade;
- preço;
- localização;
- disponibilidade;
- experiência de outros clientes.
## 3.3 Logística arcaica
 
O agendamento normalmente depende de:
 
- ligação;
- atendimento em horário comercial;
- troca de mensagens;
- espera por resposta;
- confirmação manual;
- conciliação de horários.
## 3.4 Falta de controle
 
O cliente não possui um local centralizado para:
 
- consultar compromissos;
- reagendar;
- cancelar;
- visualizar histórico;
- recuperar comprovantes;
- acompanhar pagamentos.
## 3.5 Problema do prestador
 
O profissional ou empresa perde:
 
- tempo;
- oportunidades;
- clientes;
- receita;
- organização.
Chamadas não atendidas e mensagens respondidas com atraso representam perda de conversão.
 
---
 
# 4. Justificativa
 
## 4.1 Para o consumidor
 
O produto devolve:
 
- tempo;
- autonomia;
- transparência;
- controle;
- segurança.
O consumidor passa a poder pesquisar e agendar a qualquer horário.
 
## 4.2 Para o prestador
 
A plataforma atua como ferramenta de profissionalização.
 
Ela pode:
 
- automatizar agendamentos;
- reduzir trabalho administrativo;
- aumentar visibilidade;
- melhorar ocupação;
- organizar clientes;
- apoiar decisões;
- gerar novos canais de receita.
## 4.3 Para o mercado
 
O Agendeaki busca tornar mais eficiente o encontro entre demanda e oferta de serviços.
 
---
 
# 5. Missão
 
Transformar a tarefa de agendar serviços, atualmente fragmentada e frustrante, em uma experiência:
 
- segura;
- rápida;
- transparente;
- disponível 24/7;
- empoderadora;
- simples para cliente e prestador.
---
 
# 6. Proposta de Valor
 
## Busca inteligente
 
Encontrar profissionais e empresas considerando:
 
- localização;
- categoria;
- serviço;
- preço;
- avaliação;
- disponibilidade;
- modalidade;
- relevância.
## Confiança
 
Permitir avaliações verificadas por atendimentos efetivamente concluídos.
 
## Transparência
 
Mostrar:
 
- preços;
- duração;
- serviços;
- profissionais;
- políticas;
- horários disponíveis.
## Agendamento 24/7
 
Permitir reserva fora do horário comercial sem depender de resposta manual.
 
## Gestão centralizada
 
Para o consumidor:
 
- próximos agendamentos;
- histórico;
- cancelamentos;
- reagendamentos;
- avaliações;
- pagamentos.
Para o prestador:
 
- agenda;
- equipe;
- serviços;
- clientes;
- disponibilidade;
- indicadores;
- recebimentos.
---
 
# 7. Hipóteses do Projeto
 
## 7.1 Hipótese de adesão
 
Se a plataforma centralizar múltiplos tipos de serviço, usuários preferirão uma experiência única a gerenciar vários canais de comunicação.
 
## 7.2 Hipótese de confiança
 
Se avaliações forem verificadas e detalhadas, a conversão de visitantes para agendamentos aumentará.
 
## 7.3 Hipótese de eficiência
 
Se o prestador possuir agendamento automatizado 24/7, haverá redução do tempo administrativo e aumento de reservas fora do horário comercial.
 
## 7.4 Hipótese de descoberta
 
Se existirem filtros de preço, localização, avaliação e disponibilidade, usuários descobrirão novos prestadores.
 
---
 
# 8. Estratégia de Escopo
 
O maior risco do projeto é tentar construir simultaneamente:
 
- marketplace;
- agenda;
- CRM;
- pagamentos;
- carteira;
- prontuário;
- inteligência artificial;
- integrações;
- web;
- Android;
- iOS;
- múltiplas categorias.
A estratégia recomendada é validar primeiro o núcleo do produto.
 
## Vertical inicial recomendada
 
**Beleza e bem-estar**, em uma região piloto.
 
Motivos:
 
- alta recorrência;
- forte uso de WhatsApp;
- agenda como problema real;
- menor risco regulatório que prontuários de saúde;
- facilidade para testes locais;
- serviços com duração e preço definidos.
## Expansões
 
1. pet;
2. saúde apenas para agendamento;
3. aulas;
4. serviços domésticos;
5. demais verticais.
---
 
# 9. MVP
 
## 9.1 Consumidor
 
- cadastro;
- login;
- recuperação de senha;
- localização;
- busca;
- filtro;
- perfil do prestador;
- serviços;
- preços;
- avaliação;
- disponibilidade;
- agendamento;
- reagendamento;
- cancelamento;
- histórico;
- confirmação;
- avaliação após atendimento.
## 9.2 Prestador ou empresa
 
- cadastro da empresa;
- perfil público;
- endereço;
- imagens;
- serviços;
- preços;
- duração;
- profissionais;
- horários;
- pausas;
- folgas;
- bloqueios;
- agenda diária;
- agenda semanal;
- confirmação;
- conclusão;
- cancelamento;
- histórico de clientes;
- indicadores básicos.
## 9.3 Administrador da plataforma
 
- categorias;
- aprovação de empresas;
- moderação;
- avaliações;
- denúncias;
- bloqueio de contas;
- auditoria.
## 9.4 Fora do MVP
 
- prontuário médico;
- doenças;
- exames;
- laudos;
- carteira digital;
- split complexo;
- recomendação por IA;
- chat;
- videochamada;
- muitas integrações;
- múltiplas filiais avançadas;
- microserviços;
- Kubernetes.
---
 
# 10. Funcionalidades Pós-MVP
 
Os próximos passos prioritários são:
 
1. integrações;
2. pagamentos;
3. carteira digital;
4. inteligência artificial para recomendação.
Essas funcionalidades devem ser desenvolvidas em ordem de dependência.
 
---
 
# 11. Integrações
 
Antes de integrar vários serviços externos, construir uma base interna robusta.
 
## Base técnica
 
- eventos de domínio;
- outbox;
- consumidores idempotentes;
- retry;
- backoff;
- registro de falhas;
- webhooks;
- assinatura de webhooks;
- versionamento;
- observabilidade;
- logs de integração.
## Integrações candidatas
 
- e-mail;
- notificações push;
- calendário;
- WhatsApp;
- mapas;
- geocodificação;
- pagamentos;
- analytics;
- armazenamento;
- antifraude.
## Regra arquitetural
 
O domínio não deve depender diretamente de SDKs externos.
 
Usar:
 
- interfaces;
- portas;
- adaptadores;
- contratos versionados.
---
 
# 12. Pagamentos
 
## Evolução recomendada
 
1. pagamento simples;
2. confirmação por webhook;
3. estorno;
4. conciliação;
5. split;
6. repasse;
7. disputa;
8. chargeback;
9. relatórios.
## Requisitos
 
- não armazenar cartão;
- usar provedor especializado;
- valor em unidade monetária mínima inteira;
- idempotência;
- webhook verificado;
- conciliação;
- estados explícitos;
- auditoria;
- segredo fora do repositório;
- revisão humana obrigatória.
## Estados possíveis
 
- Created;
- Pending;
- Authorized;
- Paid;
- Failed;
- Refunded;
- PartiallyRefunded;
- Cancelled;
- Disputed;
- ChargedBack.
---
 
# 13. Carteira Digital
 
O termo carteira precisa ser definido antes da implementação.
 
Possibilidades:
 
- crédito promocional;
- saldo de reembolso;
- saldo do prestador;
- contas a receber;
- valor sacável;
- fidelidade;
- dinheiro custodiado.
## Regra
 
Não modelar carteira como apenas:
 
```text
User.Balance
```
 
Usar um modelo auditável de lançamentos.
 
## Requisitos futuros
 
- ledger;
- lançamentos imutáveis;
- débito;
- crédito;
- reversão;
- extrato;
- conciliação;
- expiração;
- bloqueio;
- auditoria;
- regras contábeis;
- revisão jurídica;
- antifraude.
Uma carteira com valor custodiado deve receber análise regulatória e jurídica específica.
 
---
 
# 14. Recomendação e Inteligência Artificial
 
A IA deve entrar somente depois de existir volume e qualidade de dados.
 
## Ordem
 
1. instrumentação;
2. dados confiáveis;
3. ranking determinístico;
4. métricas;
5. experimentos;
6. recomendação personalizada;
7. monitoramento.
## Ranking inicial sem IA
 
Considerar:
 
- distância;
- disponibilidade;
- categoria;
- serviço;
- preço;
- avaliação;
- taxa de cancelamento;
- tempo de resposta;
- recorrência;
- preferência do usuário.
## IA futura
 
- recomendação personalizada;
- busca semântica;
- resumo de avaliações;
- suporte ao prestador;
- previsão de ocupação;
- previsão de cancelamento;
- otimização de agenda.
## Princípios
 
- explicar fatores da recomendação;
- evitar discriminação;
- medir impacto;
- comparar com baseline;
- permitir auditoria;
- não privilegiar publicidade sem identificação;
- proteger dados pessoais.
---
 
# 15. Stack Principal
 
## Frontend
 
- React;
- TypeScript;
- Vite;
- React Router;
- TanStack Query;
- React Hook Form;
- Zod;
- biblioteca de componentes;
- Playwright;
- PWA.
## Backend
 
- C#;
- ASP.NET Core;
- Entity Framework Core;
- PostgreSQL;
- OpenAPI;
- autenticação;
- autorização;
- testes de integração.
## Mobile
 
Estratégia:
 
1. web responsiva;
2. PWA;
3. validação;
4. empacotamento mobile.
Capacitor é a recomendação inicial para Android e iOS.
 
Tauri 2 pode ser considerado se:
 
- desktop for requisito;
- Rust for aceito;
- plugins necessários estiverem disponíveis;
- houver justificativa registrada.
---
 
# 16. Arquitetura
 
## Abordagem
 
**Monólito modular.**
 
Não iniciar com microserviços.
 
## Motivos
 
- equipe pequena;
- prazo acadêmico;
- menor custo;
- transações simples;
- implantação simples;
- depuração simples;
- testes mais fáceis;
- menor sobrecarga operacional.
## Módulos
 
- Identity;
- Organizations;
- Catalog;
- Scheduling;
- Customers;
- Marketplace;
- Reviews;
- Notifications;
- Files;
- Payments;
- Wallet;
- Recommendations;
- Integrations;
- Administration.
## Evolução para microserviços
 
Somente quando houver:
 
- escala mensurável;
- equipes separadas;
- necessidade de deploy independente;
- isolamento de falhas;
- cargas muito diferentes;
- justificativa econômica.
---
 
# 17. Estrutura Recomendada
 
```text
src/
  Agendeaki.Api/
  Agendeaki.Modules/
    Identity/
    Organizations/
    Catalog/
    Scheduling/
    Customers/
    Marketplace/
    Reviews/
    Notifications/
    Files/
    Administration/
  Agendeaki.Shared/
 
apps/
  web/
  api/
 
packages/
  ui/
  contracts/
 
tests/
  UnitTests/
  IntegrationTests/
  EndToEndTests/
 
docs/
  product/
  architecture/
  adr/
  api/
  tcc/
 
infra/
  docker/
  deployment/
```
 
A estrutura deve ser adaptada ao repositório real.
 
Não criar complexidade apenas para seguir um diagrama.
 
---
 
# 18. Agenda e Concorrência
 
O agendamento é o núcleo técnico do produto.
 
O frontend não pode ser a única proteção contra conflito.
 
## Fluxo
 
1. calcular disponibilidade;
2. selecionar horário;
3. iniciar transação;
4. verificar conflito;
5. reservar;
6. confirmar;
7. emitir evento.
## Entidade conceitual
 
```text
Appointment
- Id
- TenantId
- CustomerId
- ServiceId
- StaffId
- ResourceId
- StartsAtUtc
- EndsAtUtc
- TimeZone
- Status
- CreatedAt
- Version
```
 
## Considerar
 
- dois clientes no mesmo horário;
- profissional;
- sala;
- cadeira;
- equipamento;
- duração variável;
- buffer;
- reagendamento;
- cancelamento;
- repetição de requisição;
- fuso horário;
- horário de verão;
- idempotência.
---
 
# 19. Formulários Dinâmicos
 
A abordagem deve ser híbrida.
 
## Campos relacionais
 
- serviço;
- preço;
- duração;
- profissional;
- endereço;
- início;
- fim;
- cliente;
- status;
- política.
## Campos dinâmicos
 
Exemplos:
 
### Beleza
 
- comprimento do cabelo;
- alergias declaradas;
- tipo de procedimento.
### Pet
 
- espécie;
- raça;
- peso;
- comportamento.
### Aulas
 
- nível;
- modalidade;
- material.
### Serviços domésticos
 
- tamanho;
- cômodos;
- equipamentos.
## Modelo
 
```text
FormDefinition
- Id
- CategoryId
- Name
- Version
- JsonSchema
- UiSchema
- Status
 
FormSubmission
- Id
- FormDefinitionId
- FormVersion
- AppointmentId
- SubmittedBy
- AnswersJson
- SubmittedAt
```
 
## Regras
 
- validar frontend e backend;
- versionar;
- manter respostas antigas;
- não alterar retroativamente;
- separar cadastro do serviço de formulário pré-atendimento.
---
 
# 20. Saúde, Exames e Documentos
 
Histórico de agendamentos é diferente de prontuário.
 
Dados como:
 
- doenças;
- exames;
- laudos;
- diagnósticos;
- histórico clínico;
são dados sensíveis.
 
## MVP
 
- histórico de agendamentos;
- anexos operacionais;
- imagens públicas;
- sem prontuário.
## Fase futura
 
Exigir:
 
- base legal;
- minimização;
- consentimento quando aplicável;
- criptografia;
- autorização;
- auditoria;
- retenção;
- exclusão;
- links temporários;
- revisão jurídica;
- resposta a incidentes.
---
 
# 21. Armazenamento de Arquivos
 
Não armazenar arquivos:
 
- no PostgreSQL;
- no disco local;
- no Git;
- em Base64 nas entidades.
Usar object storage.
 
## Separação
 
```text
public-media
- logotipo
- fotos
- portfólio
 
private-documents
- documentos internos
- anexos
- futuros documentos sensíveis
```
 
## Fluxo
 
1. frontend solicita upload;
2. backend autoriza;
3. backend gera URL temporária;
4. frontend envia diretamente;
5. backend registra metadados.
---
 
# 22. Experiência do Consumidor
 
## Fluxo
 
```text
Início
→ localização
→ busca
→ resultados
→ perfil
→ serviço
→ profissional
→ horário
→ confirmação
→ meus agendamentos
→ avaliação
```
 
## Resultados
 
Mostrar:
 
- imagem;
- nome;
- nota;
- distância;
- preço;
- próximo horário;
- modalidade;
- selo de verificação.
## Princípios
 
- poucos passos;
- ação principal evidente;
- feedback imediato;
- estado vazio;
- carregamento;
- erro;
- cancelamento simples;
- acessibilidade;
- mobile first.
---
 
# 23. Experiência da Empresa
 
## Fluxo
 
```text
Criar empresa
→ perfil
→ serviço
→ profissional
→ disponibilidade
→ publicação
→ agendamento
→ atendimento
→ conclusão
→ indicadores
```
 
## Dashboard
 
Mostrar:
 
- próximos atendimentos;
- cancelamentos;
- horários livres;
- profissionais;
- ações pendentes;
- faturamento futuro;
- ocupação;
- clientes recorrentes.
---
 
# 24. Design
 
## Referências
 
- iFood;
- Airbnb;
- Uber;
- Google Maps;
- Booking;
- Calendly;
- Spotify;
- Notion;
- Material Design;
- Apple Human Interface Guidelines.
## Princípio
 
Extrair padrões, não copiar.
 
## Padrões desejados
 
- mobile first;
- hierarquia visual;
- cards;
- categorias claras;
- busca central;
- filtros rápidos;
- bottom sheet;
- skeleton;
- feedback;
- confirmação;
- navegação simples;
- linguagem amigável.
---
 
# 25. Design System
 
Componentes esperados:
 
- Button;
- Input;
- Select;
- Combobox;
- DatePicker;
- Calendar;
- TimeSlot;
- Card;
- ProviderCard;
- ServiceCard;
- ReviewCard;
- Modal;
- Drawer;
- BottomSheet;
- Toast;
- Alert;
- Badge;
- Avatar;
- Skeleton;
- EmptyState;
- Pagination;
- Navbar;
- Sidebar;
- Tabs;
- Stepper.
Definir:
 
- tokens;
- cores;
- tipografia;
- espaçamento;
- radius;
- sombras;
- estados;
- acessibilidade;
- responsividade.
---
 
# 26. Roadmap
 
## Fase 0 — Descoberta
 
- vertical;
- região;
- entrevistas;
- personas;
- jornada;
- concorrentes;
- protótipo;
- métricas.
## Fase 1 — Fundação
 
- repositório;
- CI;
- frontend;
- API;
- banco;
- autenticação;
- organizações;
- papéis;
- design system.
## Fase 2 — Primeira fatia
 
```text
empresa
→ serviço
→ profissional
→ disponibilidade
→ horário
→ agendamento
→ agenda
```
 
## Fase 3 — MVP
 
- busca;
- filtro;
- perfil;
- reagendamento;
- cancelamento;
- histórico;
- avaliação;
- imagens;
- notificações;
- administração;
- analytics.
## Fase 4 — Piloto
 
- prestadores reais;
- clientes reais;
- métricas;
- entrevistas;
- testes;
- correções.
## Fase 5 — Integrações
 
- eventos;
- outbox;
- e-mail;
- push;
- calendário;
- WhatsApp;
- mapas.
## Fase 6 — Pagamentos
 
- checkout;
- webhook;
- estorno;
- conciliação;
- split;
- disputa.
## Fase 7 — Carteira
 
- definição;
- ledger;
- créditos;
- recebíveis;
- extrato;
- auditoria.
## Fase 8 — IA
 
- baseline;
- ranking;
- experimentos;
- personalização;
- modelo;
- monitoramento.
---
 
# 27. Métricas
 
## Conveniência
 
- tempo até confirmar;
- etapas;
- abandono;
- conclusão;
- recorrência.
## Confiança
 
- conversão após avaliação;
- novos prestadores;
- nota;
- cancelamento.
## Eficiência
 
- reservas fora do horário;
- tempo administrativo;
- ocupação;
- no-show;
- mensagens evitadas.
## Descoberta
 
- filtros;
- busca;
- perfis vistos;
- conversão;
- distância;
- categorias.
## Eventos
 
```text
search_performed
provider_viewed
service_selected
slot_selected
booking_started
booking_confirmed
booking_rescheduled
booking_cancelled
booking_completed
review_submitted
payment_started
payment_confirmed
recommendation_viewed
recommendation_clicked
```
 
---
 
# 28. Infraestrutura
 
## Desenvolvimento local
 
- Docker Compose;
- PostgreSQL;
- object storage local;
- API;
- frontend;
- ferramenta de e-mail local;
- observabilidade mínima.
## Produção
 
Possibilidades:
 
- Azure;
- AWS;
- Cloudflare;
- Railway;
- Render;
- Vercel.
## Recomendação inicial
 
Escolher infraestrutura gerenciada e simples.
 
Evitar:
 
- Kubernetes;
- cluster próprio;
- broker complexo;
- banco não gerenciado;
- múltiplos provedores sem necessidade.
---
 
# 29. Segurança
 
Revisão obrigatória para:
 
- autenticação;
- autorização;
- multi-tenancy;
- uploads;
- webhooks;
- pagamentos;
- carteira;
- dados sensíveis;
- exclusão;
- migrations.
## Nunca
 
- salvar segredo no Git;
- confiar em preço do frontend;
- expor arquivo privado;
- confiar apenas na interface;
- registrar token;
- registrar senha;
- ignorar tenant;
- confirmar pagamento pela tela;
- editar migration aplicada;
- armazenar cartão.
---
 
# 30. Multi-Tenancy
 
Cada empresa deve ter dados isolados.
 
## Regras
 
- entidades empresariais possuem TenantId;
- autorização no backend;
- filtro por tenant;
- testes contra vazamento;
- papel por organização;
- auditoria;
- acesso administrativo explícito.
Papéis:
 
- Owner;
- Manager;
- Receptionist;
- Professional;
- PlatformAdmin;
- Customer.
---
 
# 31. Estratégia de Skills
 
Skills representam responsabilidades recorrentes.
 
Não criar skill apenas porque uma tecnologia existe.
 
Ignorar inicialmente skills isoladas de:
 
- MongoDB;
- Kubernetes;
- Terraform;
- RabbitMQ;
- AWS;
- Docker.
Essas responsabilidades ficam dentro de:
 
- database;
- messaging;
- cloud;
- devops.
---
 
# 32. Skills Recomendadas
 
## Liderança e produto
 
### project-lead
 
- roadmap;
- sprint;
- Trello;
- dependências;
- riscos;
- coordenação;
- status.
Não implementa código.
 
### planning
 
- épico;
- feature;
- tarefa;
- PR;
- critério;
- dependência.
### product-manager
 
- MVP;
- personas;
- métricas;
- monetização;
- prioridade;
- discovery.
### business-analyst
 
- requisitos;
- regras;
- casos de uso;
- fluxos;
- aceitação.
### marketplace-architect
 
- oferta;
- demanda;
- reputação;
- comissão;
- liquidez;
- onboarding;
- retenção.
---
 
## Arquitetura
 
### architecture
 
- módulos;
- ADR;
- DDD;
- Clean Architecture;
- monólito modular;
- trade-offs.
### vertical-slice
 
- usuário;
- interface;
- API;
- domínio;
- banco;
- teste;
- telemetria.
### scheduling-expert
 
- fuso;
- recorrência;
- conflito;
- buffers;
- recursos;
- bloqueios;
- disponibilidade.
### multi-tenant-expert
 
- isolamento;
- papéis;
- permissão;
- filtro;
- auditoria.
### search-discovery
 
- busca;
- filtro;
- ranking;
- localização;
- relevância;
- geodistância.
---
 
## Frontend e design
 
### frontend-react
 
- React;
- TypeScript;
- Vite;
- TanStack Query;
- React Hook Form;
- Zod.
### ui-ux
 
- usabilidade;
- jornada;
- acessibilidade;
- feedback;
- redução de fricção.
### design-system
 
- tokens;
- componentes;
- consistência;
- acessibilidade.
### ui-benchmark
 
Analisa padrões de:
 
- iFood;
- Airbnb;
- Uber;
- Google Maps;
- Booking;
- Calendly.
Nunca copia.
 
### mobile-experience
 
- touch;
- teclado;
- safe area;
- bottom navigation;
- responsividade;
- PWA;
- performance.
### booking-experience
 
- escolha;
- serviço;
- profissional;
- horário;
- confirmação;
- lembrete;
- pós-atendimento.
---
 
## Backend e dados
 
### backend-dotnet
 
- C#;
- ASP.NET Core;
- EF Core;
- autenticação;
- autorização.
### api-design
 
- REST;
- DTO;
- OpenAPI;
- paginação;
- filtros;
- erros;
- webhook.
### database
 
- PostgreSQL;
- integridade;
- índice;
- transação;
- migration;
- concorrência.
### cache
 
- cache;
- Redis quando necessário;
- rate limit;
- invalidação;
- sessão.
### messaging
 
- eventos;
- outbox;
- filas;
- retry;
- integração.
---
 
## Infraestrutura e qualidade
 
### cloud
 
- infraestrutura;
- armazenamento;
- CDN;
- banco gerenciado;
- escalabilidade.
### devops
 
- CI/CD;
- GitHub Actions;
- deploy;
- rollback;
- containers.
### testing
 
- unidade;
- integração;
- Playwright;
- contrato;
- carga;
- concorrência.
### security
 
- OWASP;
- LGPD;
- autenticação;
- upload;
- criptografia;
- autorização.
### performance
 
- queries;
- bundle;
- render;
- cache;
- Lighthouse.
### observability
 
- logs;
- métricas;
- tracing;
- dashboards;
- alertas.
### code-review
 
- bugs;
- segurança;
- arquitetura;
- manutenção;
- testes;
- regressão.
### refactoring
 
- melhoria interna;
- sem alterar comportamento;
- redução de duplicação;
- simplificação.
---
 
## Negócio e documentação
 
### marketplace-growth
 
- SEO;
- CAC;
- LTV;
- conversão;
- retenção;
- indicação;
- liquidez.
### finops
 
- custo;
- storage;
- banco;
- CDN;
- IA;
- projeção;
- otimização.
### ai-engineer
 
- arquitetura de dados;
- ranking;
- recomendação;
- avaliação;
- monitoramento.
Não deve implementar IA antes da base.
 
### documentation
 
- README;
- ADR;
- OpenAPI;
- guia;
- arquitetura;
- diagramas.
### tcc-writer
 
- diário;
- evidências;
- metodologia;
- hipóteses;
- resultados;
- limitações;
- referências.
Não inventa informação.
 
### context-economy
 
- carregar contexto mínimo;
- evitar duplicação;
- reutilizar resumo;
- selecionar skills;
- manter documentos enxutos.
---
 
# 33. Estrutura de Skills
 
```text
.agents/
  skills/
    project-lead/
      SKILL.md
    planning/
      SKILL.md
    product-manager/
      SKILL.md
    business-analyst/
      SKILL.md
    marketplace-architect/
      SKILL.md
    architecture/
      SKILL.md
    vertical-slice/
      SKILL.md
    scheduling-expert/
      SKILL.md
    multi-tenant-expert/
      SKILL.md
    search-discovery/
      SKILL.md
    frontend-react/
      SKILL.md
    ui-ux/
      SKILL.md
    design-system/
      SKILL.md
    ui-benchmark/
      SKILL.md
    mobile-experience/
      SKILL.md
    booking-experience/
      SKILL.md
    backend-dotnet/
      SKILL.md
    api-design/
      SKILL.md
    database/
      SKILL.md
    cache/
      SKILL.md
    messaging/
      SKILL.md
    cloud/
      SKILL.md
    devops/
      SKILL.md
    testing/
      SKILL.md
    security/
      SKILL.md
    performance/
      SKILL.md
    observability/
      SKILL.md
    code-review/
      SKILL.md
    refactoring/
      SKILL.md
    marketplace-growth/
      SKILL.md
    finops/
      SKILL.md
    ai-engineer/
      SKILL.md
    documentation/
      SKILL.md
    tcc-writer/
      SKILL.md
    context-economy/
      SKILL.md
```
 
---
 
# 34. Estrutura de Cada SKILL.md
 
Cada skill deve conter:
 
- nome;
- objetivo;
- quando usar;
- quando não usar;
- responsabilidades;
- entradas;
- saídas;
- processo;
- checklist;
- boas práticas;
- antipadrões;
- critérios de sucesso;
- exemplos de prompts.
---
 
# 35. Agentes
 
## Líder
 
- lê contexto;
- consulta status;
- prioriza;
- cria tarefas;
- coordena;
- atualiza Trello;
- mantém documentação;
- consolida resultados.
Não pode:
 
- aprovar o próprio código;
- alterar escopo;
- liberar produção;
- decidir pagamentos;
- decidir LGPD;
- acessar segredos.
## Implementador
 
- recebe tarefa limitada;
- planeja;
- implementa;
- testa;
- documenta.
## Revisor
 
- verifica critérios;
- segurança;
- tenant;
- concorrência;
- regressão;
- testes.
## Documentação e TCC
 
- registra fatos;
- evidências;
- decisões;
- métricas;
- limitações.
---
 
# 36. Trello
 
## Fonte de verdade
 
- Git: código e arquitetura;
- Trello: estado operacional;
- CI/PR: evidência técnica;
- documentos do TCC: evidência acadêmica.
## Listas
 
1. Inbox;
2. Descoberta;
3. Backlog priorizado;
4. Sprint atual;
5. Em desenvolvimento;
6. Em revisão;
7. Validação/QA;
8. Bloqueado;
9. Concluído.
## Campos do card
 
- ID;
- título;
- tipo;
- módulo;
- responsável;
- prioridade;
- objetivo;
- contexto;
- história;
- critérios;
- dependências;
- riscos;
- testes;
- documentação;
- evidência;
- issue;
- branch;
- PR.
## Automação permitida
 
- criar no Inbox;
- adicionar checklist;
- comentar;
- vincular PR;
- registrar bloqueio;
- atualizar status.
## Aprovação humana
 
- escopo;
- prioridade estratégica;
- conclusão;
- pagamento;
- carteira;
- segurança;
- LGPD;
- exclusão;
- produção.
---
 
# 37. Fluxo de Desenvolvimento
 
1. problema;
2. contexto;
3. critérios;
4. plano;
5. implementação;
6. testes;
7. revisão;
8. validação;
9. documentação;
10. conclusão.
## Antes de codificar
 
- resumir;
- identificar módulo;
- riscos;
- arquivos;
- plano;
- testes;
- ADR.
## Antes de concluir
 
```bash
dotnet format --verify-no-changes
dotnet build
dotnet test
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```
 
Registrar quando um comando não existir.
 
---
 
# 38. Definition of Ready
 
Uma tarefa está pronta quando possui:
 
- objetivo;
- valor;
- persona;
- critérios;
- dependências;
- riscos;
- fora do escopo;
- testes;
- documentação;
- evidência esperada.
---
 
# 39. Definition of Done
 
Uma tarefa está concluída quando:
 
- critérios atendidos;
- testes executados;
- build aprovado;
- lint aprovado;
- autorização revisada;
- tenant revisado;
- documentação atualizada;
- PR revisado;
- CI verde;
- evidência vinculada;
- Trello atualizado.
---
 
# 40. Documentação para o TCC
 
Manter:
 
```text
docs/
  tcc/
    PROJECT_JOURNAL.md
    EVIDENCE_LOG.md
    INTERVIEWS.md
    USABILITY_TESTS.md
    METRICS.md
    LIMITATIONS.md
```
 
## Diário
 
Registrar:
 
- data;
- participantes;
- objetivo;
- trabalho;
- observação;
- decisão;
- problema;
- evidência;
- hipótese;
- limitação;
- próximo passo.
## Evidências
 
Separar:
 
- dado bruto;
- interpretação;
- conclusão.
Nunca:
 
- inventar entrevista;
- inventar métrica;
- fabricar referência;
- apagar resultado negativo;
- afirmar causalidade sem base.
---
 
# 41. Regras para Claude
 
Claude deve:
 
- ler este documento antes de propor mudanças;
- separar fato, hipótese, decisão e recomendação;
- evitar expandir escopo;
- sugerir fatias pequenas;
- considerar mobile;
- considerar multi-tenancy;
- considerar concorrência;
- considerar LGPD;
- não inventar dados;
- não criar complexidade prematura;
- registrar decisões importantes;
- pedir aprovação humana em temas críticos;
- produzir respostas em português;
- fornecer código somente quando solicitado;
- preferir soluções simples, testáveis e reversíveis.
---
 
# 42. Prompt Inicial para Claude
 
Use o seguinte prompt dentro do Project:
 
```text
Leia integralmente o contexto do Agendeaki.
 
Atue como líder técnico e de produto, sem implementar código ainda.
 
Analise:
 
1. estado do projeto;
2. escopo;
3. riscos;
4. dependências;
5. decisões pendentes;
6. arquitetura;
7. primeira fatia vertical;
8. documentação necessária;
9. evidências para o TCC.
 
Produza:
 
- resumo factual;
- decisões humanas necessárias;
- proposta de sprint com no máximo cinco cards;
- critérios de aceitação;
- dependências;
- riscos;
- plano de testes;
- documentos que devem ser atualizados.
 
Não inclua pagamento, carteira ou IA na primeira sprint.
 
Não crie tarefas genéricas como “fazer frontend” ou “fazer backend”.
 
Cada card deve representar um resultado demonstrável por um usuário.
```
 
---
 
# 43. Primeira Fatia Recomendada
 
```text
empresa criada
→ serviço cadastrado
→ profissional cadastrado
→ disponibilidade definida
→ horário exibido
→ cliente agenda
→ empresa visualiza
```
 
Essa fatia deve ser implementada antes de:
 
- home avançada;
- dashboard completo;
- pagamentos;
- carteira;
- IA;
- integrações profundas.
---
 
# 44. Decisões Consolidadas
 
- React + TypeScript + Vite;
- C# + ASP.NET Core;
- PostgreSQL;
- monólito modular;
- web responsiva/PWA primeiro;
- Capacitor como primeira opção mobile;
- Tauri apenas com justificativa;
- beleza e bem-estar como vertical inicial;
- object storage;
- agenda como núcleo;
- formulários híbridos;
- prontuário fora do MVP;
- pagamentos após integração;
- carteira após pagamentos;
- IA após dados;
- Trello como painel;
- Git como fonte técnica;
- documentação contínua;
- agentes com limites;
- revisão humana obrigatória em áreas críticas.
---
 
# 45. Princípio Final
 
O objetivo do MVP não é provar que todas as funcionalidades podem ser programadas.
 
O objetivo é validar, com evidências, que uma experiência centralizada de descoberta e agendamento gera valor real para consumidores e prestadores.