# Evidência — RNF-06: Argon2id, TLS, zero dado sensível em página pública

> **Verificação no código e por teste, em 27/10/2026**, na branch `chore/fechamento-backend` (a partir de
> `698fa2c`). Cada item diz **como** foi verificado: leitura do código (arquivo:linha) ou teste automatizado.
> O que não foi verificado está escrito como tal.

## 1. Checklist

| # | Item | Como foi verificado | Resultado |
|---|---|---|---|
| 1 | Senha com **Argon2id** | Código: `Booking.Infrastructure/Module/Identity/Security/Argon2PasswordHasher.cs:14-18` (sal de 16 bytes, hash de 32, **m = 19.456 KiB, t = 2, p = 1** — o mínimo recomendado pela OWASP) e `:43` (comparação em tempo constante, `FixedTimeEquals`). Os parâmetros ficam no próprio hash (`$argon2id$v=19$m=…`), para subir sem invalidar os antigos | ✅ |
| 2 | Refresh token **rotativo** com **detecção de reuso** | Código: `Booking.Application/Module/Identity/Commands/RefreshSessionCommand.cs:39-43` (token já revogado reapresentado → revoga todas as sessões ativas do usuário, `auth.refresh_token_reused`) e `:54` (rotação: o atual é revogado apontando para o próximo). Só o hash SHA-256 do token vai para o banco (`SecureTokenGenerator`). Teste unitário `AuthFlowTests.Refresh_reuse_revokes_every_session_of_the_user` | ✅ |
| 3 | Limitador nas rotas de autenticação | Código: `Booking.Api/Program.cs` (política `auth`: 10 por minuto por IP) e `AuthController.cs:10` (`[EnableRateLimiting("auth")]`). Observado em execução real: o seed recebe 429 e espera (`rnf-01-busca.md`, seed de 388 s) | ✅ |
| 4 | CORS restrito, sem credenciais | Código: `Program.cs` — `WithOrigins(Cors:AllowedOrigins)`, sem configuração nenhuma origem; sem `AllowCredentials` (token no header, regra 3 de empacotamento) | ✅ |
| 5 | HTTPS e cabeçalhos de segurança | Código: `UseHttpsRedirection` existia. **Lacuna corrigida neste PR** (`afed107`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` (`Booking.Api/Common/SecurityHeaders.cs`) e `UseHsts` fora de Development. Teste: `SecurityTests.I3` (resposta comum) e `I2` (também no 500) | ✅ depois da correção |
| 6 | Nenhum dado sensível em resposta pública | Teste: `SecurityTests.I1` — estabelecimento de Saúde com agendamento sensível; as 6 rotas públicas (vitrine, serviços, profissionais, horários do dia, calendário, busca) não trazem id do agendamento, do consumidor, do usuário, nome do consumidor nem o estado do agendamento. A disponibilidade pública só devolve horários livres (`AvailableSlotsResponse`) | ✅ |
| 7 | `SensitiveAccessLog` em toda leitura de agendamento sensível pelo estabelecimento | Código: `AppointmentAccess.LogIfSensitive`, chamado em `GetAgendaQuery` (`SchedulingQueries.cs:43`), `ListPendingAppointmentsQuery` (`:69`), toda transição do dono (`AppointmentAccess.LoadAsync`), prévia e cancelamento do bloqueio (`AffectedAppointmentsService`). Teste: `IdempotencyAndConsentTests.C4` (0 entradas depois do pedido do consumidor, 1 depois de o dono confirmar). O consumidor ler ou criar o próprio pedido não gera entrada — decisão Q do `PROJECT-CONTEXT.md` | ✅ |
| 8 | Consentimento que **bloqueia** em Saúde | Teste: `C3` (sem consentimento: 403 `compliance.consent_required`, nada gravado) | ✅ |
| 9 | Nenhum segredo no repositório | Varredura de `git log --all -p` por padrões de chave (JWT, senha do Postgres, chave privada, tokens do GitHub, OpenAI, AWS, Slack, Google): **nenhuma ocorrência**. Os únicos `.env*` versionados são `.env.example` e `frontend/.env.example`, só com valores de exemplo. `.gitignore:2` cobre `.env` | ✅ |
| 10 | Chave JWT: mínimo validado, vinda de configuração | Código: `JwtOptions.cs:6` (`MinSigningKeyBytes = 32`), `DependencyInjection.cs` (`Validate` + `ValidateOnStart`: a API não sobe sem chave válida). Nenhum `appsettings*.json` tem `SigningKey`; o Compose lê `JWT_SIGNING_KEY` do `.env` | ✅ |
| 11 | Erro sem detalhe interno | Teste: `SecurityTests.I2` — 500 provocado por trigger de teste, em **Testing e em Development** (como o Compose sobe): corpo só com `type`, `title` genérico, `status` e `traceId`; sem stack, SQL, nome de exceção nem a mensagem do banco. `DomainException` responde só o `code` estável (`DomainExceptionHandler`) | ✅ |
| 12 | Isolamento entre estabelecimentos | Testes B1–B7 e F3, G1 (`isolamento-de-tenant.md`) | ✅ |
| 13 | Autorização do Admin | Testes E6 (403 para consumidor e dono, 401 para anônimo em todas as rotas de Admin; reprova com a policy desligada) | ✅ |

## 2. Lacunas — encontradas e **não** corrigidas neste PR

| Lacuna | Onde | Risco | Proposta |
|---|---|---|---|
| **Token de confirmação de e-mail e de redefinição de senha no log** | `LoggingIdentityMailer.cs:14,21` — `LogDebug` com o token bruto | Quem lê o log troca a senha de qualquer conta. Hoje só em nível Debug, que o Compose liga (`compose.yaml`) para a demonstração funcionar sem provedor de e-mail | Com um provedor de e-mail, remover o log do token; até lá, nunca ligar Debug desse logger fora do ambiente local |
| Cadastro revela se o e-mail já existe | `RegisterUserCommand.cs:29` — 409 `user.email_already_registered` | Enumeração de contas (o login e a recuperação de senha não revelam: mesma resposta para conta inexistente) | Resposta neutra no cadastro e aviso por e-mail — depende de provedor de e-mail |
| `auth.account_not_active` no login | `LoginCommand.cs:48` | Revela que a conta existe e está suspensa, só para quem acertou a senha | Aceitável; registrar |
| Código morto que viraria 500 | `TenantContextExtensions.RequireBusinessId` lança `UnauthorizedAccessException` (não `DomainException`) | Nenhum hoje: não é chamado em lugar nenhum. Se alguém usar, o "sem tenant" vira 500 em vez de 403 | Remover, ou trocar por `DomainException("tenant.missing")` |
| Bloqueio por conta no login | Só há limite por IP | Força bruta distribuída (vários IPs) contra uma conta | Fora do recorte; registrar |
| RLS no banco | ADR-003: depois do MVP | Uma consulta SQL à mão fora do EF não tem filtro de tenant | Já registrado como trabalho futuro |

## 3. Não verificado

- ⚠️ **TLS em produção** — depende da hospedagem (ADR-008, pendência G). O HSTS está ligado fora de Development,
  mas só tem efeito quando a API é servida por HTTPS.
- ⚠️ Vulnerabilidade de dependência: o `dotnet restore` roda o NuGet Audit com aviso tratado como erro
  (`Directory.Packages.props`), então o build passa sem vulnerabilidade conhecida *na data do build*; não houve
  auditoria além disso. O frontend não foi auditado (`bun audit` não executado).
- ⚠️ Exclusão de dados a pedido do titular (LGPD) — não existe fluxo de exclusão de conta no código.

## 4. E-mail e a demonstração

Nenhum ponto do código exige e-mail confirmado: o login (`LoginCommand`), o agendamento e o cadastro do
estabelecimento funcionam com `EmailConfirmedAt` nulo. A demonstração funciona sem provedor de e-mail; a
confirmação e a recuperação de senha só registram o token no log (lacuna 1 acima).
