# ADR-001 — Stack: React + Vite no frontend, .NET 10 no backend, PostgreSQL com PostGIS

- **Status:** Aceito
- **Data:** 2026-09-09
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** todos
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

**Fatos.** O projeto tem dois desenvolvedores em tempo parcial e **~9 semanas** até a entrega,
com o texto do TCC na mesma janela. O orçamento é próximo de zero.

O repertório da dupla é desigual e verificável pelos repositórios públicos: Arthur tem
projetos em C#/.NET (`ShopControl`, `APICatalogo`, `PetShopScheduling`, trilhas .NET) e Python;
Rafael tem nove repositórios, todos em React + TypeScript + Tailwind, todos de estudo, nenhum
com backend, banco, teste automatizado ou CI.

**Inferência nossa:** o custo de aprendizado é o recurso mais escasso do projeto, não o tempo
de CPU nem o de máquina. Uma tecnologia que ninguém domina consome semanas que não existem.

O produto tem duas exigências técnicas duras que restringem o banco:

1. Busca por proximidade geográfica, com filtro por raio antes de qualquer outro filtro.
2. Prevenção de dupla reserva com garantia real, não com verificação em código de aplicação.

## Problema

Que stack sustenta um marketplace de agendamento com garantia transacional forte e busca
geográfica, sendo aprendível e operável por duas pessoas em nove semanas e custo zero?

## Alternativas consideradas

### A — React + TypeScript + Vite · ASP.NET Core (.NET 10) · PostgreSQL + PostGIS

**A favor:** cada frente cai no repertório existente de quem vai escrevê-la. O PostgreSQL
resolve as duas exigências duras sozinho — `EXCLUDE USING gist` para sobreposição (ADR-005)
e PostGIS para proximidade — sem serviço adicional. Vite dá build e HMR rápidos, o que importa
quando a iteração de UI é feita por uma pessoa só. Tudo tem free tier disponível.

**Contra:** dois ecossistemas e dois gerenciadores de pacote no mesmo repositório; ninguém da
dupla escreveu ASP.NET Core em produção; PostGIS é requisito duro de hospedagem e elimina
plataformas que não permitem `CREATE EXTENSION` — risco registrado no ADR-008.

### B — Node.js + NestJS no backend, mantendo o que o pitch declarou

**A favor:** uma linguagem só no repositório inteiro; Rafael já escreve TypeScript; troca de
contexto menor entre as frentes.

**Contra:** joga fora o único repertório de backend que a dupla tem. Arthur passaria as
primeiras semanas aprendendo NestJS em vez de modelar disponibilidade e concorrência — que é
onde está a dificuldade real e o valor acadêmico do trabalho. Rejeitada por custo de aprendizado
no recurso mais escasso.

### C — React Native para o app, como o pitch declarou

**A favor:** app nativo nas lojas, gesto e navegação nativos.

**Contra:** obriga a manter **duas** interfaces — a web do painel e a nativa do consumidor —
com uma pessoa no frontend. Não reaproveita quase nada da UI web. iOS exigiria macOS, que a
dupla não tem. Rejeitada por custo de manutenção incompatível com o tamanho da equipe.
O caminho mobile fica sendo PWA, com Capacitor e Tauri consumindo o mesmo build.

### D — Banco sem PostGIS, com cálculo de distância em SQL puro

**A favor:** amplia as opções de hospedagem gratuita; menos uma extensão.

**Contra:** sem índice geoespacial, o filtro por raio vira varredura completa. A ordem de busca
obrigatória (`SlotSearch`: geografia → texto → cálculo de slots só nos candidatos) existe
justamente para o cálculo de disponibilidade rodar sobre poucas empresas. Sem PostGIS, o RNF-01
(p95 ≤ 800 ms com 30 empresas semeadas) fica sem plano de sustentação. Rejeitada.

## Decisão

Adotamos a alternativa **A**.

- **Frontend:** React + TypeScript + **Vite**. Não haverá Next.js. O produto é uma aplicação
  autenticada com pouca superfície indexável; SSR resolveria um problema de SEO que só existe
  na vitrine pública, e o custo é um framework a mais para quem está aprendendo.
- **Backend:** C# / ASP.NET Core sobre **.NET 10**.
- **Banco:** **PostgreSQL** com as extensões **PostGIS** e **btree_gist**.
- **Mobile:** PWA primeiro. Capacitor e Tauri consomem o mesmo build (ver as 6 regras de
  empacotamento no `CLAUDE.md` §3).

## Consequências

### O que fica mais fácil

- A garantia de não-sobreposição passa a ser uma constraint de banco em vez de código
  distribuído — ver ADR-005.
- O filtro geográfico usa índice, e o cálculo de disponibilidade roda sobre um conjunto pequeno.
- Cada desenvolvedor produz desde a primeira semana, no que já sabe.
- Free tier disponível em todas as camadas.

### O que fica mais difícil

- **Contrato entre as frentes.** Duas linguagens significam que a mudança de um DTO no C#
  não quebra o TypeScript em tempo de compilação. Mitigação: cliente TypeScript gerado do
  OpenAPI em `packages/contracts`, para o compilador acusar a divergência.
- **Hospedagem restrita.** PostGIS elimina plataformas que não permitem `CREATE EXTENSION`.
  Risco tratado no ADR-008; o CI já executa `CREATE EXTENSION postgis` a cada build para que
  a incompatibilidade apareça cedo.
- Curva de ASP.NET Core no início.

### O que passa a ser proibido

- Introduzir Next.js ou qualquer framework de SSR sem novo ADR.
- Introduzir React Native, Blazor ou MAUI.
- Depender de recurso de banco que não exista no PostgreSQL.

## Como saber que erramos

- Se nenhuma hospedagem de custo aceitável permitir PostGIS, a premissa geográfica cai e
  o ADR-008 força revisão deste.
- Se a divergência de contrato entre C# e TypeScript virar fonte recorrente de bug mesmo com
  os tipos gerados, a hipótese de "duas linguagens custam pouco" estava errada.
- Se, na semana 4, o backend ainda não tiver a primeira fatia de pé, o custo de aprendizado
  de ASP.NET Core foi subestimado.

## Referências

- `PROJECT-CONTEXT.md` §4 — decisões técnicas fechadas
- `docs/produto/modelo-de-dominio.md` §9 — `SlotSearch` e a ordem obrigatória de filtros
- ADR-002 (pendente) — revogação formal da stack declarada no pitch
- ADR-005, ADR-006, ADR-008
- Perfis públicos: `github.com/ArthurBomfimDev`, `github.com/RafaelErnandes` — consultados em 2026-09-01
