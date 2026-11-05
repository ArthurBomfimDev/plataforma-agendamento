namespace Booking.Application.Contracts.Reputation;

/// <summary>
/// Nota de um alvo para quem exibe ou ordena. <c>Average</c> é nulo enquanto há menos de três avaliações: o alvo é "Novo"
/// e a contagem aparece mesmo assim.
/// </summary>
public sealed record RatingInfo(double? Average, int Count)
{
    public static RatingInfo None { get; } = new(null, 0);
}

/// <summary>Superfície pública do módulo Reputation (ADR-032): a busca e as vitrines leem a nota por aqui.</summary>
public interface IReputationDirectory
{
    /// <summary>
    /// A nota de cada estabelecimento informado. Quem não tem nenhuma avaliação não aparece no resultado
    /// (use <see cref="RatingInfo.None"/>). Entre tenants de propósito: a busca é pública.
    /// </summary>
    Task<IReadOnlyDictionary<Guid, RatingInfo>> GetBusinessRatingsAsync(IReadOnlyCollection<Guid> businessIds, CancellationToken ct = default);
}
