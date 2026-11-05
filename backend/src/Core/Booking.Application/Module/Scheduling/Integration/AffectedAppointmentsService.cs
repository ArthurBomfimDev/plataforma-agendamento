using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Contracts.Scheduling;
using Booking.Application.Module.Scheduling.Commands;
using Booking.Application.Module.Scheduling.Converter;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Scheduling;
using Booking.Domain.Enum.Module.Scheduling;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Scheduling;

namespace Booking.Application.Module.Scheduling.Integration;

/// <summary>
/// Implementa <see cref="IAffectedAppointments"/> com as regras do próprio Scheduling: dono e atendente resolvem o bloqueio
/// de qualquer profissional, e o profissional, o da própria agenda, e o cancelamento passa pela máquina de estados do agendamento (grava <c>AppointmentEvent</c>).
/// </summary>
public sealed class AffectedAppointmentsService(
    IAppointmentRepository appointments,
    AppointmentAccess access,
    IAppointmentNotifier notifier,
    IUnitOfWork unitOfWork,
    TimeProvider clock) : IAffectedAppointments
{
    /// <summary>Teto de um "cancelar todos": acima disso, o dono divide o período. Evita uma transação sem limite.</summary>
    public const int MaxCancelledAtOnce = 500;

    /// <summary>Dono e atendente enxergam qualquer período; o profissional, só o da própria agenda (a de outro é proibida).</summary>
    private async Task EnsureScopeAsync(Guid? professionalId, CancellationToken ct)
    {
        Guid? own = await access.RestrictToProfessionalAsync(ct);

        if (own is Guid ownId && professionalId != ownId)
        {
            throw new DomainException("auth.forbidden");
        }
    }

    public async Task<PagedResult<AffectedAppointment>> ListAsync(
        Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, PageRequest page, CancellationToken ct = default)
    {
        await EnsureScopeAsync(professionalId, ct);

        PagedResult<Appointment> result = await appointments.ListActiveInRangeAsync(professionalId, fromUtc, toUtc, page, ct);

        foreach (Appointment appointment in result.Items)
        {
            access.LogIfSensitive(appointment, "preview_block");
        }

        // A prévia é leitura pelo estabelecimento: agendamento sensível deixa registro (LGPD, Art. 11).
        if (result.Items.Any(a => a.IsSensitive))
        {
            await unitOfWork.SaveChangesAsync(ct);
        }

        return new PagedResult<AffectedAppointment>([.. result.Items.Select(ToAffected)], result.Page, result.PageSize, result.TotalCount);
    }

    public async Task<int> StageCancellationAsync(
        Guid? professionalId, DateTimeOffset fromUtc, DateTimeOffset toUtc, string reason, CancellationToken ct = default)
    {
        await EnsureScopeAsync(professionalId, ct);

        IReadOnlyList<Appointment> affected =
            await appointments.ListActiveInRangeForUpdateAsync(professionalId, fromUtc, toUtc, MaxCancelledAtOnce + 1, ct);

        if (affected.Count > MaxCancelledAtOnce)
        {
            throw new DomainException(
                "schedule_exception.too_many_affected", new Dictionary<string, object?> { ["max"] = MaxCancelledAtOnce });
        }

        SchedulingActor by = access.CurrentActor();
        DateTimeOffset now = clock.GetUtcNow();

        foreach (Appointment appointment in affected)
        {
            // O estabelecimento cancela o que confirmou e recusa o que ainda estava pendente: são as transições
            // que a máquina de estados permite a ele. As duas liberam o horário.
            AppointmentChange change;
            if (appointment.Status == AppointmentStatus.Confirmed)
            {
                appointment.CancelByBusiness(by, now, reason);
                change = AppointmentChange.CancelledByBusiness;
            }
            else
            {
                appointment.Reject(by, now, reason);
                change = AppointmentChange.Rejected;
            }

            access.LogIfSensitive(appointment, "cancel_by_block");

            // Na outbox, no mesmo SaveChanges do bloqueio: tudo ou nada vale também para o aviso.
            await notifier.NotifyAsync(AppointmentConverter.ToFacts(appointment), change, ct);
        }

        return affected.Count;
    }

    private static AffectedAppointment ToAffected(Appointment a) =>
        new(a.Id, a.ProfessionalId, a.ServiceNameSnapshot, a.StartsAt, a.EndsAt, a.Status.ToString(), a.WalkInName);
}
