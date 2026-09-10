# ADR-004 — Identidade única, papéis por associação e conta global do consumidor

- **Status:** Aceito
- **Data:** 2026-09-09
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Identity, Tenancy, People
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

O sistema tem quatro papéis: `Customer`, `Professional`, `Owner` e `Admin` da plataforma.

Três situações reais do mercado brasileiro de beleza e saúde tornam a modelagem menos óbvia
do que parece:

1. **O dono também atende.** Na maioria das barbearias e salões pequenos, quem administra a
   agenda é a mesma pessoa que corta o cabelo. `Owner` e `Professional` coexistem na mesma pessoa.
2. **O profissional também é consumidor.** O barbeiro marca hora na manicure do outro lado da rua.
3. **O consumidor circula entre empresas.** Ele agenda na barbearia, na clínica e no petshop.
   O histórico só faz sentido se estiver reunido.

A situação 3 colide diretamente com o isolamento por tenant do ADR-003: se o consumidor fosse
uma linha por empresa, "meus agendamentos" precisaria costurar N cadastros da mesma pessoa.

## Problema

Como modelar identidade e papéis de forma que a mesma pessoa possa ser consumidor e membro de
empresa, sem duplicar conta e sem furar o isolamento entre tenants?

## Alternativas consideradas

### A — Tipos de conta separados: `CustomerAccount`, `ProfessionalAccount`, `OwnerAccount`

**A favor:** o modelo fica legível de imediato; cada tipo carrega só os campos que usa.

**Contra:** quebra nas três situações acima. O dono que atende precisaria de duas contas e
dois logins. O barbeiro que marca hora precisaria de uma terceira. E-mail único global vira
impossível, ou o mesmo e-mail passa a existir em três tabelas. **Rejeitada:** o modelo
contradiz o comportamento real do mercado que o produto atende.

### B — Uma conta com um campo `Role` (enum)

**A favor:** simples, uma tabela, uma coluna.

**Contra:** não representa acumulação — a pessoa é `Owner` **e** `Professional`. E não
representa que o papel é **relativo a uma empresa**: alguém pode ser `Owner` da empresa X e
não ter papel nenhum na empresa Y. Um enum na tabela de usuário não tem onde guardar isso.
**Rejeitada.**

### C — Uma conta global + papéis por associação a empresa

**A favor:** representa as três situações sem exceção. Um login por pessoa. E-mail único global.
O papel passa a ser um fato sobre a relação pessoa↔empresa, que é o que ele é de verdade.

**Contra:** toda verificação de autorização passa a exigir duas informações — quem é a pessoa
e em que empresa a ação acontece. A resposta a "esse usuário é `Owner`?" deixa de existir sem
o contexto da empresa.

## Decisão

Adotamos **C**.

- **`User`** é a identidade única da plataforma. E-mail único global, `PasswordHash` em
  **Argon2id**, `Id` em GUID v7 (ordenável, bom para índice B-tree).
- **`BusinessMembership`** liga `User` a `Business` e carrega os papéis como *flags*:
  `Owner`, `Professional`, acumuláveis na mesma associação.
- **`Customer`** é perfil de consumidor, 1:1 com `User`, **global e fora do tenant**.
  Não existe `Customer` por empresa; a relação empresa↔consumidor é derivada dos agendamentos.
- **`Professional`** é perfil de execução, pendurado na associação — não no usuário.
- **`Admin`** é papel de plataforma, fora de qualquer `Business`.

**Invariantes:**

1. Toda empresa tem ao menos um `Owner` ativo. A remoção do último `Owner` é recusada.
2. Um `User` tem no máximo uma associação ativa por empresa.
3. **Um `User` com papel `Professional` tem no máximo uma associação ativa no total.**
   Profissional pertence a **uma** empresa.
4. Perfil público de profissional exige `PublicProfileConsentAt` preenchido. Visibilidade
   pública sem consentimento registrado é recusada, não avisada.

A invariante 3 é a mais restritiva e é deliberada: profissional em múltiplas empresas
multiplica a complexidade do `AvailabilityCalculator`, que passaria a somar jornadas e
conflitos entre empresas diferentes. Está registrado em "fora do MVP".

## Consequências

### O que fica mais fácil

- Um login por pessoa, em todos os papéis. O dono que atende usa a mesma conta.
- "Meus agendamentos" é uma consulta por `CustomerId`, atravessando empresas naturalmente.
- Convidar colaborador é criar `BusinessMembership` — não criar conta.
- Acumular papéis não exige modelagem nova.

### O que fica mais difícil

- **Autorização deixa de ser trivial.** Toda verificação precisa de usuário **e** empresa.
  O token carrega a associação ativa; trocar de empresa exige trocar de contexto.
- O JWT fica maior e mais sujeito a erro de modelagem. É por isso que autenticação e
  autorização estão na lista de revisão humana obrigatória.
- A invariante 3 vai frustrar algum caso real — o profissional que atende em dois salões.
  Aceitamos conscientemente, e está registrado como limitação.

### O que passa a ser proibido

- Criar tabela de conta separada por papel.
- Guardar papel diretamente no `User`.
- Criar `Customer` vinculado a `Business`.
- Expor perfil de profissional sem `PublicProfileConsentAt`.

## Como saber que erramos

- Se aparecer caso de uso que exija profissional em duas empresas antes do fim do MVP,
  a invariante 3 foi restritiva demais.
- Se a lógica de autorização precisar de mais de duas informações (usuário, empresa) para
  decidir uma ação comum, o modelo de papéis está simples demais.
- Se surgir necessidade de dado de consumidor específico por empresa (ficha, preferência),
  a decisão de `Customer` global precisa de complemento — provavelmente uma entidade nova
  no tenant, não a revogação desta.

## Referências

- `PROJECT-CONTEXT.md` §5 — identidade e papéis; §6 — matriz de permissões
- `docs/produto/modelo-de-dominio.md` §3 (Identity), §4 (Tenancy), §5 (People)
- ADR-003 — o `Customer` global é a exceção explícita ao isolamento por tenant
