using Booking.Domain.Entity.Base;

namespace Booking.Domain.Entity.Module.Notifications;

/// <summary>
/// Uma entrega pendente, gravada na mesma transação do fato que a gerou (ADR-010, decisão 7; ADR-021). Um worker a
/// envia depois, fora da requisição, com nova tentativa e recuo progressivo. Cada linha é uma entrega: processada uma
/// vez, ela não é enviada de novo.
/// </summary>
/// <remarks>
/// A tabela é a <c>outbox</c> das decisões de 22/09, genérica por <see cref="Type"/>. Fica no Domain, e não só na
/// infraestrutura, porque o EF só mapeia entidade de domínio (ADR-010, decisão 5).
/// </remarks>
public sealed class OutboxMessage : BaseEntity, IAuditable
{
    public const int MaxAttempts = 10;
    public const int MaxErrorLength = 1000;

    private static readonly TimeSpan _firstRetry = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan _maxRetry = TimeSpan.FromHours(1);

    /// <summary>O que a linha entrega. Na Onda 5B, só <c>email</c>.</summary>
    public string Type { get; private set; } = null!;

    /// <summary>JSON da entrega. Apagado quando processada: pode conter link com token de uso único.</summary>
    public string Payload { get; private set; } = null!;

    public DateTimeOffset NextAttemptAt { get; private set; }
    public int Attempts { get; private set; }

    /// <summary>Reivindicada por um worker até este instante; outro worker não a pega antes.</summary>
    public DateTimeOffset? LockedUntil { get; private set; }

    public DateTimeOffset? ProcessedAt { get; private set; }

    /// <summary>Desistida depois de <see cref="MaxAttempts"/>. O payload fica, para reenvio manual.</summary>
    public DateTimeOffset? FailedAt { get; private set; }

    public string? LastError { get; private set; }

    private OutboxMessage()
    {
    }

    public static OutboxMessage Create(string type, string payload, DateTimeOffset now) =>
        new()
        {
            Type = type,
            Payload = payload,
            NextAttemptAt = now,
        };

    public bool IsPending => ProcessedAt is null && FailedAt is null;

    public void MarkProcessed(DateTimeOffset now)
    {
        ProcessedAt = now;
        LockedUntil = null;
        LastError = null;
        Payload = "{}";
    }

    public void RecordFailure(DateTimeOffset now, string error)
    {
        Attempts++;
        LockedUntil = null;
        LastError = error.Length > MaxErrorLength ? error[..MaxErrorLength] : error;

        if (Attempts >= MaxAttempts)
        {
            FailedAt = now;
            return;
        }

        NextAttemptAt = now + RetryDelay(Attempts);
    }

    /// <summary>30 s, 1 min, 2 min, 4 min… até 1 h.</summary>
    public static TimeSpan RetryDelay(int attempts)
    {
        double seconds = _firstRetry.TotalSeconds * Math.Pow(2, Math.Max(0, attempts - 1));
        return seconds >= _maxRetry.TotalSeconds ? _maxRetry : TimeSpan.FromSeconds(seconds);
    }
}
