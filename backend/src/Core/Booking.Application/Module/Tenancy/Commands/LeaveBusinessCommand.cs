using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.People;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Tenancy;

namespace Booking.Application.Module.Tenancy.Commands;

/// <summary>
/// "Sair do estabelecimento" (ADR-031): quem tem conta na equipe (profissional ou atendente) remove o próprio vínculo. O
/// perfil de profissional sai da vitrine na hora (é desativado); o histórico de agendamentos permanece, porque é registro
/// do estabelecimento e do consumidor. O dono não sai: ele encerra o estabelecimento por outro caminho.
/// </summary>
public sealed class LeaveBusinessCommand(
    IBusinessMembershipRepository memberships,
    IProfessionalLinker professionals,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        Guid businessId = actor.RequireBusinessId();
        Guid userId = actor.RequireUserId();

        BusinessMembership membership = await memberships.GetByBusinessAndUserAsync(businessId, userId, ct)
            ?? throw new DomainException("auth.forbidden");

        // O domínio recusa o dono (business_membership.cannot_remove_owner) e quem já saiu.
        membership.Remove(clock.GetUtcNow());
        await professionals.DeactivateByMembershipAsync(membership.Id, ct);

        await unitOfWork.SaveChangesAsync(ct);
    }
}
