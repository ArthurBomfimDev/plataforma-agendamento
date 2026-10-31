using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Scheduling;
using Booking.Arguments.Module.Availability;
using Booking.Domain.Entity.Base;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Availability.Queries;

/// <summary>
/// Prévia de um bloqueio: os agendamentos <c>Pending</c>/<c>Confirmed</c> que cairiam dentro dele. Não grava nada
/// além do log de acesso a agendamento sensível.
/// </summary>
public sealed class PreviewAffectedAppointmentsQuery(IAffectedAppointments affected, IActorContext actor)
{
    public async Task<PagedResult<AffectedAppointmentResponse>> ExecuteAsync(
        Guid? professionalId, DateTimeOffset startsAt, DateTimeOffset endsAt, PageRequest page, CancellationToken ct = default)
    {
        actor.RequireOwner();
        TimeRange period = TimeRange.Of(startsAt, endsAt);

        PagedResult<AffectedAppointment> result = await affected.ListAsync(professionalId, period.Start, period.End, page, ct);

        return new PagedResult<AffectedAppointmentResponse>(
            [.. result.Items.Select(a => new AffectedAppointmentResponse(a.Id, a.ProfessionalId, a.ServiceName, a.StartsAt, a.EndsAt, a.Status, a.AttendeeName))],
            result.Page,
            result.PageSize,
            result.TotalCount);
    }
}
