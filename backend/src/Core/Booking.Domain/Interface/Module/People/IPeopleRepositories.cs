using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Enum.Module.People;

namespace Booking.Domain.Interface.Repository.Module.People;

public interface IProfessionalRepository
{
    /// <summary>Do estabelecimento do token (filtro global de tenant).</summary>
    Task<Professional?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Em qualquer estabelecimento, sem depender do token: a página pública do profissional e a fila do Admin. Quem chama
    /// confere se está ativo e se o estabelecimento aparece.
    /// </summary>
    Task<Professional?> GetByIdAcrossTenantsAsync(Guid id, CancellationToken ct = default);

    /// <summary>O perfil ligado a um vínculo, no estabelecimento do token.</summary>
    Task<Professional?> GetByMembershipIdAsync(Guid membershipId, CancellationToken ct = default);

    /// <summary>De um estabelecimento informado explicitamente, sem depender do token (aceite de convite).</summary>
    Task<Professional?> GetByIdOfBusinessAsync(Guid businessId, Guid id, CancellationToken ct = default);

    Task<PagedResult<Professional>> ListAsync(PageRequest page, CancellationToken ct = default);

    /// <summary>Vitrine: ativos de um estabelecimento informado explicitamente.</summary>
    Task<PagedResult<Professional>> ListActiveOfBusinessAsync(Guid businessId, PageRequest page, CancellationToken ct = default);

    void Add(Professional professional);
}

public interface IProfessionalRemovalRequestRepository
{
    Task<ProfessionalRemovalRequest?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>Fila do Admin: no estado pedido, os mais antigos primeiro.</summary>
    Task<PagedResult<ProfessionalRemovalRequest>> ListByStatusAsync(
        RemovalRequestStatus status, PageRequest page, CancellationToken ct = default);

    void Add(ProfessionalRemovalRequest request);
}

public interface ICustomerRepository
{
    Task<Customer?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);

    void Add(Customer customer);
}
