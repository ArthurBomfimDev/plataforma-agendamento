using Booking.Application.Common.Search;
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

    public async Task<IReadOnlyDictionary<Guid, ServiceHighlight>> GetHighlightsAsync(
        IReadOnlyCollection<Guid> businessIds, string? term, CancellationToken ct = default)
    {
        if (businessIds.Count == 0)
        {
            return new Dictionary<Guid, ServiceHighlight>();
        }

        // Entre estabelecimentos por natureza, como FilterBusinessesOfferingAsync: filtra pela lista recebida, que já
        // passou pelo filtro geográfico e só tem estabelecimentos ativos.
        List<Service> services = await context.AcrossTenants<Service>().AsNoTracking()
            .Where(s => businessIds.Contains(s.BusinessId) && s.IsActive)
            .ToListAsync(ct);

        List<Guid> serviceIds = [.. services.Select(s => s.Id)];
        ILookup<Guid, ServiceProfessional> links = (await context.AcrossTenants<ServiceProfessional>().AsNoTracking()
                .Where(l => serviceIds.Contains(l.ServiceId))
                .ToListAsync(ct))
            .ToLookup(l => l.ServiceId);

        // Cada serviço com profissional habilitado, pelo preço do profissional mais barato.
        var offers = services
            .Where(s => links[s.Id].Any())
            .Select(s =>
            {
                ServiceProfessional cheapest = links[s.Id].MinBy(l => l.EffectivePriceCents(s))!;
                return new ServiceHighlight(s.BusinessId, s.Id, s.Name, cheapest.EffectiveDurationMinutes(s), cheapest.EffectivePriceCents(s));
            })
            .ToList();

        IReadOnlyList<string> wanted = string.IsNullOrWhiteSpace(term) ? [] : SearchText.Expand(term);

        return offers
            .GroupBy(o => o.BusinessId)
            .ToDictionary(
                g => g.Key,
                g => g.Where(o => SearchText.Matches(o.Name, wanted)).MinBy(o => o.FromPriceCents)
                    ?? g.MinBy(o => o.FromPriceCents)!);
    }

    public async Task<IReadOnlySet<Guid>> FilterBusinessesOfferingAsync(
        IReadOnlyCollection<Guid> businessIds, string term, CancellationToken ct = default)
    {
        if (businessIds.Count == 0 || string.IsNullOrWhiteSpace(term))
        {
            return new HashSet<Guid>();
        }

        // Sem acento e com sinônimos (ADR-024): a comparação é em memória, sobre os nomes dos serviços ativos dos
        // candidatos que o filtro geográfico já cortou. Busca entre estabelecimentos por natureza: filtra pela lista
        // recebida, nunca devolve dado do serviço.
        IReadOnlyList<string> wanted = SearchText.Expand(term);
        var names = await context.AcrossTenants<Service>().AsNoTracking()
            .Where(s => businessIds.Contains(s.BusinessId) && s.IsActive)
            .Select(s => new { s.BusinessId, s.Name })
            .ToListAsync(ct);

        return names.Where(s => SearchText.Matches(s.Name, wanted)).Select(s => s.BusinessId).ToHashSet();
    }
}
