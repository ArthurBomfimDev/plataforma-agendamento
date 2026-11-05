using Booking.Domain.Entity.Base;

namespace Booking.Domain.Entity.Module.Catalog;

/// <summary>
/// Habilita um profissional num serviço, com preço e duração próprios quando diferem do padrão
/// ("corte com o Ricardo custa R$ 70, com o Fernando R$ 50") sem duplicar o serviço.
/// </summary>
public sealed class ServiceProfessional : BaseEntity, IAuditable, ITenantScoped
{
    public Guid BusinessId { get; private set; }
    public Guid ServiceId { get; private set; }
    public Guid ProfessionalId { get; private set; }
    public long? PriceOverrideCents { get; private set; }
    public int? DurationOverrideMinutes { get; private set; }

    private ServiceProfessional()
    {
    }

    public static ServiceProfessional Enable(Guid businessId, Guid serviceId, Guid professionalId, long? priceOverrideCents, int? durationOverrideMinutes)
    {
        var link = new ServiceProfessional { BusinessId = businessId, ServiceId = serviceId, ProfessionalId = professionalId };
        link.SetOverrides(priceOverrideCents, durationOverrideMinutes);
        return link;
    }

    public void SetOverrides(long? priceOverrideCents, int? durationOverrideMinutes)
    {
        if (priceOverrideCents is long price)
        {
            Service.EnsurePrice(price);
        }

        if (durationOverrideMinutes is int duration)
        {
            Service.EnsureDuration(duration);
        }

        PriceOverrideCents = priceOverrideCents;
        DurationOverrideMinutes = durationOverrideMinutes;
    }

    public long EffectivePriceCents(Service service) => PriceOverrideCents ?? service.PriceCents;

    public int EffectiveDurationMinutes(Service service) => DurationOverrideMinutes ?? service.DurationMinutes;
}
