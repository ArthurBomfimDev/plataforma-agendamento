namespace Booking.Domain.Module.People;

public sealed class LegacyCustomer
{
    /// <summary>✗ Decisão 3 — id sequencial, enumerável.</summary>
    public long Id { get; init; }

    /// <summary>✗ Decisão 3 — chave estrangeira sequencial, enumerável.</summary>
    public int BusinessId { get; init; }

    /// <summary>✓ Decisão 3.</summary>
    public Guid PublicId { get; init; }
}
