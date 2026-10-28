# ADR-022 — Provedores de geocodificação e CEP, limites e privacidade da coordenada

- **Status:** Proposto
- **Data:** 2026-10-28
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Tenancy (porta e consultas), frontend (seletor de localização)
- **Substitui:** —
- **Substituído por:** —
- **Complementa:** ADR-016 (porta de geocodificação e confirmação pelo dono)

---

## Contexto

**Fato.** Até a Onda 6B, a busca do consumidor usava uma cidade fixa (`DEFAULT_LOCATION`, Garça-SP) e a porta
`IGeocodingProvider` da ADR-016 não existia no código.

**Fato.** A API pública do Nominatim aceita no máximo 1 requisição por segundo, exige `User-Agent` que identifique a
aplicação, pede cache do lado de quem consulta e proíbe autocomplete. A BrasilAPI e o ViaCEP são gratuitos, sem
chave, sem SLA.

**Fato.** A coordenada do consumidor é dado pessoal (LGPD; decisões de 22/09 §5.5): uso transitório, sem log.

**Fato.** O CEP não traz coordenada: os dois provedores devolvem logradouro, bairro, cidade e UF.

## Problema

Quais provedores usar agora, como respeitar os limites deles com uma API pública, e como impedir que a coordenada do
consumidor vaze para terceiros ou para o log — sem amarrar o código a nenhum provedor?

## Alternativas consideradas

### A — Chamar os provedores direto do navegador

**A favor:** nenhum código no backend.
**Contra:** o `User-Agent` e o limite de 1 por segundo ficam nas mãos de cada aparelho; sem cache compartilhado; o
provedor recebe o IP e a coordenada exata do consumidor; trocar de provedor vira nova versão do app.

### B — Proxy no backend, com cache, fila e arredondamento (Nominatim + BrasilAPI/ViaCEP)

**A favor:** um `User-Agent`, um limite e um cache para todos; o terceiro vê o IP do servidor e a coordenada
arredondada; trocar de provedor é configuração.
**Contra:** a API passa a depender de serviços gratuitos sem SLA; mais uma rota pública para proteger.

### C — Provedor pago desde já (Azure Maps, Google)

**A favor:** SLA, precisão de telhado, autocomplete permitido.
**Contra:** chave e custo antes de haver volume; a ADR-016 já deixa o pago para produção.

## Decisão

Adotamos **B**.

- **Portas na Application** (`Module/Tenancy/Geo`): `IGeocodingProvider` (`GeocodeAsync`, `ReverseAsync`) e
  `IPostalCodeLookup`. O `Autocomplete` previsto na ADR-016 **não** entra: o provedor desta fase o proíbe.
- **Adaptadores na Infrastructure**: `NominatimGeocodingProvider`; `BrasilApiPostalCodeLookup` (padrão) e
  `ViaCepPostalCodeLookup`, escolhidos por `Geo__PostalCode__Provider`. Endereços por `Geo__Nominatim__BaseUrl` e
  `Geo__PostalCode__BaseUrl` — uma instância própria do Nominatim é só trocar a URL.
- **Rotas públicas** `GET /api/geo/postal-code/{cep}`, `/api/geo/search?q=` (até 5, só Brasil) e
  `/api/geo/reverse?lat=&lng=`, com limite de 30 por minuto por IP (`geo`).
- **HTTP:** `HttpClient` por provedor, tempo máximo por tentativa (`Geo__TimeoutSeconds`, padrão 5 s) e **uma** nova
  tentativa em falha transitória (rede, tempo esgotado, 5xx, 429). Depois disso, `503 geo.provider_unavailable`.
  `User-Agent` de `Geo__UserAgent`; contato opcional em `Geo__Nominatim__Email`.
- **Limite do Nominatim:** uma fila de horários na instância (`NominatimThrottle`) espaça as chamadas em
  `Geo__Nominatim__MinIntervalMilliseconds` (padrão 1000).
- **Cache** em memória, com tamanho limitado (5 000 entradas), por consulta normalizada (sem espaço sobrando, sem
  diferença de caixa) e, no reverso, pelo ponto já arredondado. Validade `Geo__CacheHours` (padrão 24 h); resposta
  vazia vale 1 h; falha não é guardada.
- **Privacidade da coordenada:** arredondada para **3 casas decimais** (~110 m) antes de sair para o terceiro — na
  consulta e de novo no adaptador. O reverso pede `zoom=14` (bairro): o rótulo nunca desce à rua. Os `HttpClient`
  dos provedores não têm os loggers padrão (`RemoveAllLoggers`), porque eles escreveriam a URL com o ponto; o teste
  L4 prova, com Debug aberto em toda categoria, que nem o ponto exato nem o arredondado chegam ao log.
- **Sem autocomplete:** o frontend só busca no envio.
- **Frontend:** `useGeolocation()` (regra 5 de empacotamento), seletor com aviso antes da permissão, CEP, texto e
  "Garça, SP (demonstração)"; a escolha fica no `localStorage`, com o ponto arredondado.

## Consequências

### O que fica mais fácil

- Trocar para um provedor pago ou uma instância própria é configuração e, no máximo, um adaptador novo da mesma porta.
- O teste roda os adaptadores reais com a rede substituída (`FakeGeoHttp`): URL, cabeçalho, nova tentativa e leitura
  do JSON são exercitados sem sair da máquina.

### O que fica mais difícil

- A busca por endereço depende de serviços gratuitos sem SLA; fora do ar, a tela oferece os outros caminhos.
- O limite de 1 por segundo e o cache valem **por instância**: com duas instâncias da API, o Nominatim público
  receberia até 2 por segundo. Escalar exige instância própria do Nominatim ou provedor pago.
- O CEP não tem ponto: o frontend geocodifica o endereço do CEP (do mais preciso ao mais largo), e o ponto pode cair
  no centro do bairro ou da cidade.

### O que passa a ser proibido

- Mandar a coordenada do consumidor a um terceiro sem arredondar.
- Registrar em log a coordenada do consumidor ou a URL de uma chamada de geocodificação.
- Chamar o geocodificador a cada tecla (autocomplete) enquanto o provedor for o Nominatim público.

## Evolução para produção

Provedor pago com SLA (Azure Maps, pela pendência I, ou outro) como mais um adaptador de `IGeocodingProvider`;
autocomplete só então. Cache distribuído se houver mais de uma instância. Nada disso muda a porta nem o frontend.

## Premissa não verificada

**Os provedores públicos respondem bem para Garça-SP.** Nenhuma chamada real foi feita nesta onda: os testes usam
respostas gravadas à mão no formato documentado. Precisão, tempo de resposta e disponibilidade não foram medidos.

## Como saber que erramos

- Se o Nominatim público começar a recusar (429/403) a demonstração.
- Se o ponto do CEP cair longe demais do bairro para a busca por raio de 20 km servir.

## Referências

- ADR-016 · `docs/produto/decisoes-localizacao-notificacao-modelo.md` §5.3 e §5.5
- `backend/src/Core/Booking.Application/Module/Tenancy/Geo/` e `Queries/GeoQueries.cs`
- `backend/src/Infrastructure/Booking.Infrastructure/Module/Tenancy/Geo/`
- `backend/tests/Booking.IntegrationTests/Tenancy/GeoTests.cs` — L1 a L7
- Política de uso do Nominatim: <https://operations.osmfoundation.org/policies/nominatim/>
