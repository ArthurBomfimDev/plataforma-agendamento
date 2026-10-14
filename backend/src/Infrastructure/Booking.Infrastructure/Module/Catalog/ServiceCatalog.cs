using Booking.Application.Contracts.Catalog;
using Booking.Domain.Entity.Module.Catalog;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Catalog;

public sealed class ServiceCatalog(BookingDbContext context) : IServiceCatalog
{
    public async Task<BookableService?> GetBookableAsync(Guid businessId, Guid serviceId, Guid professionalId, CancellationToken ct = default)
    {
        Service? service = await context.OfBusiness<Service>(businessId).AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == serviceId && x.IsActive, ct);

        if (service is null)
        {
            return null;
        }

        ServiceProfessional? link = await context.OfBusiness<ServiceProfessional>(businessId).AsNoTracking()
            .FirstOrDefaultAsync(x => x.ServiceId == serviceId && x.ProfessionalId == professionalId, ct);

        return link is null
            ? null
            : new BookableService(
                service.Id,
                businessId,
                professionalId,
                service.Name,
                link.EffectiveDurationMinutes(service),
                service.BufferBeforeMinutes,
                service.BufferAfterMinutes,
                service.SlotStepMinutes,
                link.EffectivePriceCents(service));
    }

    public Task<bool> HasBookableServiceAsync(Guid businessId, CancellationToken ct = default) =>
        context.OfBusiness<Service>(businessId)
            .Where(s => s.IsActive)
            .AnyAsync(s => context.OfBusiness<ServiceProfessional>(businessId).Any(l => l.ServiceId == s.Id), ct);

    public async Task<IReadOnlySet<Guid>> FilterBusinessesOfferingAsync(
        IReadOnlyCollection<Guid> businessIds, string term, CancellationToken ct = default)
    {
        if (businessIds.Count == 0 || string.IsNullOrWhiteSpace(term))
        {
            return new HashSet<Guid>();
        }

        string pattern = $"%{term.Trim()}%";

        // Busca entre estabelecimentos por natureza: filtra pela lista recebida, nunca devolve dado do serviço.
        List<Guid> ids = await context.AcrossTenants<Service>()
            .Where(s => businessIds.Contains(s.BusinessId) && s.IsActive && EF.Functions.ILike(s.Name, pattern))
            .Select(s => s.BusinessId)
            .Distinct()
            .ToListAsync(ct);

        return ids.ToHashSet();
    }
}
