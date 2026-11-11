using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Reputation;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.Reputation;

/// <summary>
/// Média e contagem denormalizadas de um alvo (estabelecimento ou profissional), atualizadas na mesma transação da
/// avaliação (ADR-032). Guarda a soma e quantas notas de cada valor, para a distribuição. A média só aparece a partir de
/// <see cref="MinReviewsToShow"/> avaliações; antes disso o alvo é "Novo".
/// </summary>
public sealed class RatingSummary : BaseEntity, IAuditable, ITenantScoped
{
    public const int MinReviewsToShow = 3;

    public Guid BusinessId { get; private set; }
    public RatingTarget Target { get; private set; }
    public Guid TargetId { get; private set; }
    public int Count { get; private set; }
    public long Sum { get; private set; }
    public int Stars1 { get; private set; }
    public int Stars2 { get; private set; }
    public int Stars3 { get; private set; }
    public int Stars4 { get; private set; }
    public int Stars5 { get; private set; }

    private RatingSummary()
    {
    }

    public static RatingSummary Create(Guid businessId, RatingTarget target, Guid targetId) =>
        new() { BusinessId = businessId, Target = target, TargetId = targetId };

    public bool HasAverage => Count >= MinReviewsToShow;

    /// <summary>Média de 1 a 5, ou nulo enquanto há menos de três avaliações.</summary>
    public double? Average => HasAverage ? (double)Sum / Count : null;

    public IReadOnlyList<int> Distribution => [Stars1, Stars2, Stars3, Stars4, Stars5];

    public void Add(int rating)
    {
        Bucket(rating, +1);
        Count++;
        Sum += rating;
    }

    public void Remove(int rating)
    {
        if (Count == 0)
        {
            throw new DomainException("review.summary_empty");
        }

        Bucket(rating, -1);
        Count--;
        Sum -= rating;
    }

    public void Replace(int oldRating, int newRating)
    {
        Remove(oldRating);
        Add(newRating);
    }

    private void Bucket(int rating, int delta)
    {
        switch (rating)
        {
            case 1: Stars1 += delta; break;
            case 2: Stars2 += delta; break;
            case 3: Stars3 += delta; break;
            case 4: Stars4 += delta; break;
            case 5: Stars5 += delta; break;
            default: throw new DomainException("review.rating_invalid");
        }
    }
}
