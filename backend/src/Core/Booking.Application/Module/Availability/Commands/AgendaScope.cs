using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Tenancy;
using Booking.Domain.Exceptions;

namespace Booking.Application.Module.Availability.Commands;

/// <summary>
/// Quem pode mexer em bloqueios e folgas de quem (ADR-030): dono e atendente, de todos os profissionais; o profissional,
/// só dos próprios. Espelha a regra de agenda do Scheduling (<c>AppointmentAccess</c>); a fronteira de módulo impede
/// reaproveitar a classe de lá.
/// </summary>
public sealed class AgendaScope(IActorContext actor, IBusinessDirectory businesses, IPeopleDirectory people)
{
    /// <summary>Nulo para dono e atendente (sem restrição); o id do próprio perfil, para o profissional.</summary>
    public async Task<Guid?> OwnProfessionalAsync(CancellationToken ct)
    {
        Guid businessId = actor.RequireBusinessId();

        if (actor.OperatesWholeAgenda())
        {
            return null;
        }

        BusinessMembershipInfo membership = await businesses.FindActiveMembershipAsync(businessId, actor.RequireUserId(), ct)
            ?? throw new DomainException("auth.forbidden");

        return await people.FindProfessionalIdByMembershipAsync(businessId, membership.MembershipId, ct)
            ?? throw new DomainException("auth.forbidden");
    }

    /// <summary>
    /// Recusa (<c>auth.forbidden</c>) o profissional que mira o bloqueio de outro, ou o do estabelecimento todo
    /// (<paramref name="professionalId"/> nulo). Devolve o id do estabelecimento do token.
    /// </summary>
    public async Task<Guid> EnsureCanActOnAsync(Guid? professionalId, CancellationToken ct)
    {
        Guid businessId = actor.RequireBusinessId();
        Guid? own = await OwnProfessionalAsync(ct);

        if (own is Guid ownId && professionalId != ownId)
        {
            throw new DomainException("auth.forbidden");
        }

        return businessId;
    }
}
