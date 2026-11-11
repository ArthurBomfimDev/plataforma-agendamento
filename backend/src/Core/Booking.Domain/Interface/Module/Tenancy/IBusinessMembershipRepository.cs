using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;

namespace Booking.Domain.Interface.Repository.Module.Tenancy;

public interface IBusinessMembershipRepository
{
    Task<BusinessMembership?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<BusinessMembership?> GetByBusinessAndUserAsync(Guid businessId, Guid userId, CancellationToken ct = default);
    /// <summary>Quantos estabelecimentos a conta tem como dona (vínculo Owner ativo), em qualquer estado.</summary>
    Task<int> CountOwnedByUserAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Vagas ocupadas por contas (vínculos Active e Invited) do estabelecimento do token, inclusive o dono.</summary>
    Task<int> CountSeatsAsync(CancellationToken ct = default);

    /// <summary>Vínculos ativos do estabelecimento do token, paginados: a seção Equipe do painel.</summary>
    Task<PagedResult<BusinessMembership>> ListActiveAsync(PageRequest page, CancellationToken ct = default);

    void Add(BusinessMembership membership);
}
