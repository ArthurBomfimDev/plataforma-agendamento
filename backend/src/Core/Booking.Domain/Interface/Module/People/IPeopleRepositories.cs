using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.People;

namespace Booking.Domain.Interface.Repository.Module.People;

public interface IProfessionalRepository
{
    /// <summary>Do estabelecimento do token (filtro global de tenant).</summary>
    Task<Professional?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task<PagedResult<Professional>> ListAsync(PageRequest page, CancellationToken ct = default);

    /// <summary>Vitrine: ativos de um estabelecimento informado explicitamente.</summary>
    Task<PagedResult<Professional>> ListActiveOfBusinessAsync(Guid businessId, PageRequest page, CancellationToken ct = default);

    void Add(Professional professional);
}

public interface ICustomerRepository
{
    Task<Customer?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);

    void Add(Customer customer);
}
