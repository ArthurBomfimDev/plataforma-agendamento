using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Compliance;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Tenancy;
using Booking.Domain.Entity.Module.Scheduling;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Scheduling;

namespace Booking.Application.Module.Scheduling.Commands;

/// <summary>
/// Regras de acesso do lado do estabelecimento (matriz de permissões): o proprietário opera a agenda toda;
/// o profissional, só a própria. Leitura de agendamento sensível sempre deixa registro (LGPD, Art. 11).
/// </summary>
public sealed class AppointmentAccess(
    IAppointmentRepository appointments,
    IBusinessDirectory businesses,
    IPeopleDirectory people,
    IComplianceGateway compliance,
    IActorContext actor,
    TimeProvider clock)
{
    /// <summary>Nulo para o proprietário (vê todos); o id do próprio profissional, para o papel Professional.</summary>
    public async Task<Guid?> RestrictToProfessionalAsync(CancellationToken ct)
    {
        Guid businessId = actor.RequireBusinessId();

        if (actor.IsOwner())
        {
            return null;
        }

        BusinessMembershipInfo membership = await businesses.FindActiveMembershipAsync(businessId, actor.RequireUserId(), ct)
            ?? throw new DomainException("auth.forbidden");

        return await people.FindProfessionalIdByMembershipAsync(businessId, membership.MembershipId, ct)
            ?? throw new DomainException("auth.forbidden");
    }

    public async Task<Appointment> LoadAsync(Guid appointmentId, string action, CancellationToken ct)
    {
        Guid? ownProfessional = await RestrictToProfessionalAsync(ct);

        Appointment appointment = await appointments.GetByIdAsync(appointmentId, ct)
            ?? throw new DomainException("appointment.not_found");

        // Agenda de outro profissional responde como inexistente, não como proibida.
        if (ownProfessional is Guid professionalId && appointment.ProfessionalId != professionalId)
        {
            throw new DomainException("appointment.not_found");
        }

        LogIfSensitive(appointment, action);
        return appointment;
    }

    public void LogIfSensitive(Appointment appointment, string action)
    {
        if (appointment.IsSensitive)
        {
            compliance.LogSensitiveAccess(appointment.BusinessId, actor.RequireUserId(), appointment.Id, action, clock.GetUtcNow());
        }
    }

    public SchedulingActor CurrentActor() => new(actor.RequireUserId(), actor.BusinessRole ?? "Customer");
}
