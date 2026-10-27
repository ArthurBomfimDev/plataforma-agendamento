# ADR-016 — Geocodificação: porta, provedor por fase e confirmação pelo dono

- **Status:** Proposto
- **Data:** 2026-10-26
- **Decisores:** Arthur Bomfim, Rafael Ernandes
- **Módulos afetados:** Tenancy, frontend (onboarding e busca)
- **Substitui:** —
- **Substituído por:** —

---

## Contexto

**Fato.** A busca por raio é a porta de entrada do consumidor (`ST_DWithin` + índice GiST, ADR-008). Um
estabelecimento com o ponto errado some da busca de quem está perto, ou aparece para quem está longe.

**Fato.** Geocodificador devolve um palpite com precisão variável — telhado, rua, bairro ou cidade. Tratar
o palpite como verdade produz estabelecimento a centenas de metros do lugar certo, descoberto só por
reclamação.

**Fato.** Decisão de 22/09 (`docs/produto/decisoes-localizacao-notificacao-modelo.md` §5), ainda sem ADR.

**Fato.** A API pública do Nominatim aceita 1 requisição por segundo, exige User-Agent identificando a
aplicação e cache do lado de quem consulta, e proíbe autocomplete.

**Fato, estado do código em 26/10.** `Business` tem `Location`, `LocationPrecision`, `LocationSource`,
`GeocodedAt` e `LocationConfirmedAt`. A busca só considera quem tem `location_confirmed_at`. A porta
`IGeocodingProvider` **não existe no código**: `ConfirmLocationCommand` registra o palpite e a confirmação
juntos, vindos do mapa da tela, com o comentário de que a porta está fora do recorte. Ainda não há tela de
onboarding.

## Problema

De onde vem o ponto do estabelecimento, quem garante que ele está certo, e como trocar de provedor sem
mexer no domínio?

## Alternativas consideradas

### A — Ponto do geocodificador, sem confirmação

**A favor:** onboarding sem etapa a mais.
**Contra:** a precisão do palpite fica escondida; o erro só aparece por reclamação.

### B — Ponto digitado ou marcado pelo dono, sem geocodificador

**A favor:** nenhuma dependência externa.
**Contra:** o dono parte de um mapa vazio; endereço e ponto podem não bater.

### C — Geocodificador dá o palpite, o dono confirma o pino; provedor atrás de porta

**A favor:** o palpite acelera; a confirmação garante. Trocar de provedor vira configuração.
**Contra:** uma etapa a mais no onboarding; mudança de endereço exige nova confirmação.

## Decisão

Adotamos **C**.

- **O pino confirmado é o plano A, não o fallback.** O geocodificador dá o palpite; o dono confirma ou
  arrasta. Só entra na busca por raio quem tem `LocationConfirmedAt`.
- O ponto guarda precisão (`Rooftop`, `Street`, `Locality`, `City`), origem e datas. Ponto com precisão de
  cidade não exibe "a 200 m".
- Mudança de endereço obriga nova geocodificação e nova confirmação. O ponto nunca migra sozinho.
- Porta `IGeocodingProvider` (`Geocode`, `ReverseGeocode`, `Autocomplete`). Provedor por fase: **Nominatim**
  no TCC e em desenvolvimento; provedor pago com SLA em produção, a avaliar (Azure Maps, se o Azure for
  Students vier — pendência I).
- Posição do consumidor: pedida no momento de uso, com três saídas (permitiu, negou, falhou), uso
  transitório, sem log; atrás de `useGeolocation()` (regra 5 de empacotamento).

## Consequências

### O que fica mais fácil

- A busca por raio confia no ponto, porque o ponto foi confirmado por quem conhece o lugar.
- Trocar Nominatim por provedor pago não toca o domínio.

### O que fica mais difícil

- O onboarding ganha uma tela de mapa.
- A política de uso do Nominatim público limita volume e proíbe autocomplete; com volume, é preciso
  instância própria ou provedor pago.

### O que passa a ser proibido

- Entrar na busca sem ponto confirmado.
- Atualizar o ponto automaticamente quando o endereço muda.
- Guardar a posição do consumidor sem ele pedir.

## Premissa não verificada

**O Nominatim atende a demonstração.** Inferência pela política de uso e pelo volume previsto (30
estabelecimentos semeados). Não foi medido: em 26/10 a porta não existe e o seed grava o ponto direto. Se a
precisão do Nominatim em Garça-SP for ruim a ponto de o palpite atrapalhar mais do que ajuda, a confirmação
continua valendo, mas o provedor precisa ser revisto.

## Como saber que erramos

- Se donos confirmarem o pino sem olhar, e o erro de posição continuar aparecendo por reclamação.
- Se a etapa do mapa for o ponto onde o onboarding é abandonado (H3 do TCC mede o tempo de configuração).

## Referências

- `docs/produto/decisoes-localizacao-notificacao-modelo.md` §5
- `backend/src/Core/Booking.Application/Module/Tenancy/Commands/ManageCurrentBusinessCommands.cs` — `ConfirmLocationCommand`
- `backend/src/Infrastructure/Booking.Infrastructure/Module/Tenancy/Repository/BusinessRepository.cs` — `FindBookableNearbyAsync`
- `PROJECT-CONTEXT.md` §5 (Localização), §11 (pendência I)
