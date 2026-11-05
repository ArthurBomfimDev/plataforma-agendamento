using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;

namespace Booking.Domain.Interface.Repository.Module.Tenancy;

public interface IBusinessInvitationRepository
{
    /// <summary>Do estabelecimento do token (filtro global de tenant).</summary>
    Task<BusinessInvitation?> GetByIdAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// Pelo hash do token, em qualquer estabelecimento: quem abre o link ainda não tem contexto. A chave é o hash, que
    /// só quem recebeu o e-mail conhece.
    /// </summary>
    Task<BusinessInvitation?> GetByTokenHashAsync(string tokenHash, CancellationToken ct = default);

    /// <summary>Convites pendentes (nem aceitos, nem revogados, nem expirados) do estabelecimento do token.</summary>
    Task<PagedResult<BusinessInvitation>> ListPendingAsync(DateTimeOffset now, PageRequest page, CancellationToken ct = default);

    /// <summary>Quantos convites pendentes ocupam vaga no estabelecimento do token.</summary>
    Task<int> CountPendingAsync(DateTimeOffset now, CancellationToken ct = default);

    /// <summary>Já existe convite pendente para este e-mail no estabelecimento do token?</summary>
    Task<bool> ExistsPendingForEmailAsync(string email, DateTimeOffset now, CancellationToken ct = default);

    void Add(BusinessInvitation invitation);
}
