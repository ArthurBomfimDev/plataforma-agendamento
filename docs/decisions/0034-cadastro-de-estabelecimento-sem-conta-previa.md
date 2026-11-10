# ADR-034: cadastro de estabelecimento sem conta prévia

## Status

Proposto (10/11/2026). **Exige revisão humana: toca autenticação.**

## Contexto

Para cadastrar um estabelecimento, a pessoa precisava criar uma conta comum (com data de nascimento de consumidor), confirmar
o e-mail, entrar e só então achar "Tenho um negócio". O assistente (`#/cadastrar-estabelecimento`) exigia sessão. Quem vinha
só para cadastrar o negócio passava por um fluxo pensado para o consumidor, e o `redirect` se perdia na confirmação: o link do
e-mail não carrega o destino.

`RegisterUserCommand` e a regra de e-mail confirmado não mudam. `Owner` e `Professional` são papéis do vínculo, não tipos de
conta (CLAUDE.md §2).

## Decisão

1. **Um modelo de usuário.** A conta criada pelo assistente é a mesma conta de sempre. Ela pode agendar como consumidor e
   administrar um estabelecimento. Não há tipo de conta "só dono".
2. **Sem endpoint novo.** O passo "Sua conta" usa `POST /api/auth/register` com `email`, `password` e `fullName`, as mesmas
   regras de senha (8 a 128 caracteres). A diferença é só no frontend: não pede a data de nascimento.
3. **E-mail confirmado continua obrigatório.** O cadastro não abre sessão; segue para "Confira seu e-mail", que agora explica
   que o cadastro do estabelecimento continua depois da confirmação. `RequireEmailConfirmation` não foi tocado.
4. **Página pública `#/para-estabelecimentos`.** Explica o que é e para quem é. Sem sessão, o link "Para estabelecimentos" do
   cabeçalho do desktop e o "Tenho um negócio" da Home levam a ela; com sessão, vão direto ao assistente.
5. **Voltar ao assistente depois da confirmação, pelo `next`.**
   - `next` é um parâmetro do login com **lista fechada** de destinos internos (`safeNext`): o assistente, o convite, a página
     "Para estabelecimentos", "Meus agendamentos" e "Minha conta", e só com os parâmetros `retomar` e `token`. Destino externo,
     `//`, contrabarra, fragmento, espaço, parâmetro desconhecido ou valor acima de 800 caracteres são ignorados.
   - Como o link do e-mail não carrega o destino, ele fica **guardado no aparelho** (`localStorage`), amarrado ao e-mail de
     quem criou a conta, com validade de 48 horas, e é conferido de novo pela lista fechada na leitura. O login só o usa se o
     e-mail digitado for o mesmo, e o apaga ao entrar.
   - Armazenamento ausente (aba anônima) não quebra nada: a pessoa entra e cai na Home, e retoma por "Tenho um negócio".
6. **Retomada.** O progresso do cadastro fica no servidor. Quem tem um rascunho o retoma pela faixa de status do painel
   (`?retomar=1`), como já era. Quem já tem sessão pula "Sua conta".

## Consequências

- Quem cria a conta pelo assistente fica **sem perfil de consumidor** (data de nascimento). Se tentar agendar, a API responde
  `customer.profile_required` ("Complete seu cadastro de consumidor para agendar."). **Não há tela para completar o perfil**:
  é a mesma limitação de quem entra por outro aparelho. Fica como trabalho futuro (`limitacoes-e-trabalho-futuro.md`).
- O aceite dos termos de uso, no passo "Sua conta", é uma caixa obrigatória na tela; **a API não o registra**, como no
  cadastro comum, que só mostra o texto. O aceite que vale e é gravado é o dos termos do estabelecimento, no fim do assistente.
- O destino pendente fica em armazenamento do navegador. Quando é o do convite, leva o token do convite. Isso é registrado na
  ADR-033, com as razões para não ser log nem URL externa.
- No celular, a barra superior não ganhou o link "Para estabelecimentos" (já tem logotipo, tema, "Entrar" e "Criar conta"). Quem
  não tem sessão chega pelo cartão "Tem um negócio?" da Home.
- Quem tem o e-mail de confirmação aberto em outro navegador perde o destino guardado e cai na Home depois de entrar.

## Para o Arthur decidir

- Aceitar esta ADR, ou exigir a data de nascimento também no assistente (evita a conta sem perfil de consumidor, ao custo de um
  campo que o dono não precisa).
- Revisão humana em autenticação: a mudança não enfraquece a confirmação de e-mail, mas guarda o destino pós-login no aparelho.
