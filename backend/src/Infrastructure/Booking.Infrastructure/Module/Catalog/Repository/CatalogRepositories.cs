using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Catalog;
using Booking.Domain.Interface.Repository.Module.Catalog;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Catalog.Repository;

public sealed class ServiceRepository(BookingDbContext context) : IServiceRepository
{
    public Task<Service?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Set<Service>().FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<PagedResult<Service>> ListAsync(PageRequest page, CancellationToken ct = default) =>
        context.Set<Service>().OrderBy(x => x.Name).ToPagedAsync(page, ct);

    public Task<PagedResult<Service>> ListActiveOfBusinessAsync(Guid businessId, PageRequest page, CancellationToken ct = default) =>
        context.OfBusiness<Service>(businessId).AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Name).ToPagedAsync(page, ct);

    public void Add(Service service) => context.Set<Service>().Add(service);
}

public sealed class ServiceProfessionalRepository(BookingDbContext context) : IServiceProfessionalRepository
{
    public Task<ServiceProfessional?> GetAsync(Guid serviceId, Guid professionalId, CancellationToken ct = default) =>
        context.Set<ServiceProfessional>().FirstOrDefaultAsync(x => x.ServiceId == serviceId && x.ProfessionalId == professionalId, ct);

    public async Task<IReadOnlyList<ServiceProfessional>> ListForServicesAsync(
        Guid businessId, IReadOnlyCollection<Guid> serviceIds, CancellationToken ct = default) =>
        serviceIds.Count == 0
            ? []
            : await context.OfBusiness<ServiceProfessional>(businessId).AsNoTracking().Where(x => serviceIds.Contains(x.ServiceId)).ToListAsync(ct);

    public void Add(ServiceProfessional link) => context.Set<ServiceProfessional>().Add(link);

    public void Remove(ServiceProfessional link) => context.Set<ServiceProfessional>().Remove(link);
}
