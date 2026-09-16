namespace Booking.Domain.Base;

/// <summary>
/// Pedido de página. Toda listagem recebe um — não existe listagem sem limite (ADR-010, decisão 4).
/// </summary>
/// <remarks>
/// A validação dos limites entra com a primeira fatia vertical, junto do contrato de API.
/// </remarks>
public sealed record PageRequest(int Page, int PageSize);
