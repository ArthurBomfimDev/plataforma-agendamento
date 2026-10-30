using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Catalog;

namespace Booking.Domain.Interface.Repository.Module.Catalog;

public interface IServiceRepository
{
    Task<Service?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task<PagedResult<Service>> ListAsync(PageRequest page, CancellationToken ct = default);

    /// <summary>Vitrine: serviços ativos de um estabelecimento informado explicitamente.</summary>
    Task<PagedResult<Service>> ListActiveOfBusinessAsync(Guid businessId, PageRequest page, CancellationToken ct = default);

    void Add(Service service);
}

public interface IServiceProfessionalRepository
{
    Task<ServiceProfessional?> GetAsync(Guid serviceId, Guid professionalId, CancellationToken ct = default);

    /// <summary>Habilitações dos serviços informados, no estabelecimento informado.</summary>
    Task<IReadOnlyList<ServiceProfessional>> ListForServicesAsync(Guid businessId, IReadOnlyCollection<Guid> serviceIds, CancellationToken ct = default);

    void Add(ServiceProfessional link);

    void Remove(ServiceProfessional link);
}
