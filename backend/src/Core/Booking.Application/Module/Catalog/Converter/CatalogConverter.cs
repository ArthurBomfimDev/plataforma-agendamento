using Booking.Arguments.Module.Catalog;
using Booking.Domain.Entity.Module.Catalog;

namespace Booking.Application.Module.Catalog.Converter;

public static class CatalogConverter
{
    public static ServiceProfessionalResponse ToResponse(ServiceProfessional link, Service service) =>
        new(
            link.ProfessionalId,
            link.EffectivePriceCents(service),
            link.EffectiveDurationMinutes(service),
            link.PriceOverrideCents is not null || link.DurationOverrideMinutes is not null);

    public static ServiceResponse ToResponse(Service service, IEnumerable<ServiceProfessional> links) =>
        new(
            service.Id,
            service.Name,
            service.Description,
            service.DurationMinutes,
            service.BufferBeforeMinutes,
            service.BufferAfterMinutes,
            service.SlotStepMinutes,
            service.PriceCents,
            service.SuppliesNote,
            service.IsActive,
            [.. links.Where(l => l.ServiceId == service.Id).Select(l => ToResponse(l, service))]);

    public static PublicServiceResponse ToPublic(Service service, IEnumerable<ServiceProfessional> links) =>
        new(
            service.Id,
            service.Name,
            service.Description,
            service.DurationMinutes,
            service.PriceCents,
            [.. links.Where(l => l.ServiceId == service.Id).Select(l => ToResponse(l, service))]);
}
