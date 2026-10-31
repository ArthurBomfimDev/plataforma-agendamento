# ADR-025 — Camada de API do frontend: Axios, `base`/`models`/`services` e `useService` sobre o TanStack Query

- **Status:** Proposto
- **Data:** 2026-10-30
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** frontend (`src/api`) — consome todos os módulos do backend
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

**Fato.** Até 29/10 a comunicação com o backend morava em `src/lib/api`, em arquivos por assunto técnico:
`client.ts` (cliente sobre `fetch`), `upload.ts` (`XMLHttpRequest` escrito à mão, para ter progresso),
`endpoints.ts` (334 linhas, todos os domínios), `queries.ts` (503 linhas, todos os hooks do TanStack Query) e
`types.ts` (375 linhas, todos os contratos).

**Fato.** Cada hook de escrita repetia `useQueryClient()` + `invalidateQueries` (7 ocorrências); a limpeza do cache
da conta aparecia duas vezes; nenhuma consulta repassava o `AbortSignal` do TanStack Query, então sair da tela não
cancelava a requisição.

**Fato.** O cliente tinha uma propriedade que não pode se perder: a renovação do access token é *single-flight*.
Duas renovações em paralelo usariam o mesmo refresh token, e o backend lê isso como roubo e derruba todas as sessões
(rotação com detecção de reuso). Havia teste para isso.

**Fato.** A equipe pediu, na refatoração estrutural de 30/10, o Axios como cliente HTTP e a organização em
`api/base`, `api/models` e `api/services`, com um hook `useService` em `api/base/hooks`.

**Inferência nossa.** O pedido do Axios é de padronização e de interceptors, não de uma limitação do `fetch` que
tenha causado defeito. Isso pesa na seção "Como saber que erramos".

## Problema

Como organizar a camada única de acesso à API (regra 1 de empacotamento) para que cada domínio tenha um lugar,
o cache seja invalidado de um jeito só e a renovação de token continue correta?

## Alternativas consideradas

### A — Manter o cliente sobre `fetch` e só reorganizar as pastas

**A favor:** nenhuma dependência nova; o cliente já estava testado; zero risco de regressão na renovação.
**Contra:** o envio de arquivo continua uma segunda implementação (XHR à mão) com a própria renovação de token;
sem interceptors, cabeçalho, renovação e tradução de erro ficam amarrados numa função só.

### B — `ky` (wrapper pequeno sobre `fetch`)

**A favor:** cerca de 4 kB; hooks antes/depois da requisição; continua `fetch`.
**Contra:** não informa progresso de upload — o XHR à mão continuaria existindo; ninguém da equipe usa.

### C — Axios, com adaptador `fetch` e `xhr` só no envio de arquivo

**A favor:** interceptors para token, renovação e erro num lugar; `params` monta a query string (some o helper
manual); `onUploadProgress` no adaptador `xhr` elimina o upload escrito à mão; é o cliente que a equipe conhece.
**Contra:** +21 kB gzip no bundle (medido: 339,16 → 360,54 kB, antes do code splitting do ADR-027); os testes que
simulavam o `fetch` passam a receber um `Request` montado, não `(url, init)`.

## Decisão

Usamos **Axios** (`src/api/base/axios.ts`), com `adapter: 'fetch'` — o que os WebViews do Capacitor e do Tauri
têm em comum com o navegador — e `adapter: 'xhr'` só na chamada de envio de imagem, pelo progresso.

A camada passa a ser `src/api`, não mais `src/lib/api`:

- `base/` — instância, `request`/`authRequest`, `interceptors/` (token Bearer nas chamadas `authenticated`,
  renovação *single-flight* no 401 com uma repetição, todo erro como `ApiError` com o código estável do
  ProblemDetails), `errors.ts`, `query-client.ts` e `hooks/use-service`.
- `models/<domínio>/types.ts` — os contratos, divididos pelos módulos do backend.
- `services/<domínio>/` — `endpoints.ts` (caminhos), `index.ts` (as chamadas), `hooks.ts` (consultas e escritas) e
  `types.ts` quando há parâmetros. `services/query-keys.ts` concentra todas as chaves do cache.

O `useService` **não** é uma segunda camada de estado. `useService` é o `useQuery` com o sinal de cancelamento
chegando ao serviço; `useServiceMutation` é o `useMutation` com a invalidação declarada (`invalidates`,
`invalidateOn: 'success' | 'settled'`). Cache, loading, erro e nova tentativa continuam com o TanStack Query.
`useQueries` (consultas em paralelo por profissional) é usado direto.

## Consequências

### O que fica mais fácil

- Achar a chamada de um domínio: `services/<domínio>`.
- Invalidar o cache certo: a escrita declara o que afeta.
- Cancelar requisição de tela abandonada: automático.
- Envio de arquivo com token e renovação: os mesmos interceptors de qualquer chamada.

### O que fica mais difícil

- O bundle carrega o Axios (21 kB gzip).
- Teste que simula o `fetch` precisa ler `request.url` e `request.headers`, e no Node precisa de `baseURL` absoluta
  (`src/api/base/interceptors/index.test.ts`).
- A flag `auth` do Axios (Basic Auth) já existe; a nossa se chama `authenticated`, declarada por *module
  augmentation* em `base/types.ts`. Quem confundir as duas manda credencial Basic sem querer.

### O que passa a ser proibido

- Chamar `axios`, `fetch` ou `XMLHttpRequest` fora de `src/api/base`.
- Hook de dado de servidor fora de `services/<domínio>/hooks.ts`, ou `useQuery`/`useMutation` direto em tela para
  dado que tem serviço.
- Chave de cache escrita à mão fora de `services/query-keys.ts`.

## Como saber que erramos

- Se aparecer duas renovações de token para o mesmo refresh token nos logs do backend (`auth.refresh_token_reused`
  sem roubo real), a renovação *single-flight* quebrou e a decisão precisa de revisão imediata.
- Se, depois do code splitting, o Axios for a maior dependência do chunk inicial e nenhum interceptor novo tiver
  entrado até a defesa, a alternativa A teria bastado.

## Referências

- `CLAUDE.md` §3, regra 1 — o texto ainda cita `src/lib/api`; precisa passar a `src/api`.
- `PROJECT-CONTEXT.md` — a linha da camada única de API também cita `src/lib/api`.
- ADR-027 — estrutura de pastas e code splitting do frontend.
