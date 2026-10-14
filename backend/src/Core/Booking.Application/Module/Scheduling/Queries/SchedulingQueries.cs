using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Scheduling.Commands;
using Booking.Application.Module.Scheduling.Converter;
using Booking.Arguments.Module.Scheduling;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Scheduling;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Scheduling;

namespace Booking.Application.Module.Scheduling.Queries;

/// <summary>Agenda do dia: o proprietário vê todos ou filtra; o profissional vê só a própria.</summary>
public sealed class GetAgendaQuery(
    IAppointmentRepository appointments,
    IBusinessDirectory businesses,
    AppointmentAccess access,
    IActorContext actor,
    IUnitOfWork unitOfWork)
{
    public async Task<PagedResult<AppointmentResponse>> ExecuteAsync(DateOnly date, Guid? professionalId, PageRequest page, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireBusinessId();
        Guid? own = await access.RestrictToProfessionalAsync(ct);

        BusinessSchedulingInfo business = await businesses.GetSchedulingInfoAsync(businessId, ct)
            ?? throw new DomainException("business.not_found");

        TimeZoneInfo zone = TimeZoneInfo.FindSystemTimeZoneById(business.TimeZone);
        DateTimeOffset from = LocalMidnightUtc(date, zone);
        DateTimeOffset to = LocalMidnightUtc(date.AddDays(1), zone);

        PagedResult<Appointment> result = await appointments.ListInRangeAsync(from, to, own ?? professionalId, page, ct);
        return await RespondAsync(result, "read_agenda", ct);
    }

    private async Task<PagedResult<AppointmentResponse>> RespondAsync(PagedResult<Appointment> result, string action, CancellationToken ct)
    {
        foreach (Appointment appointment in result.Items)
        {
            access.LogIfSensitive(appointment, action);
        }

        // Persiste o log de acesso: a leitura de dado sensível não pode passar sem registro.
        if (result.Items.Any(a => a.IsSensitive))
        {
            await unitOfWork.SaveChangesAsync(ct);
        }

        return new PagedResult<AppointmentResponse>([.. result.Items.Select(AppointmentConverter.ToResponse)], result.Page, result.PageSize, result.TotalCount);
    }

    private static DateTimeOffset LocalMidnightUtc(DateOnly date, TimeZoneInfo zone) =>
        new(TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Unspecified), zone), TimeSpan.Zero);
}

public sealed class ListPendingAppointmentsQuery(IAppointmentRepository appointments, AppointmentAccess access, IUnitOfWork unitOfWork)
{
    public async Task<PagedResult<AppointmentResponse>> ExecuteAsync(PageRequest page, CancellationToken ct = default)
    {
        Guid? own = await access.RestrictToProfessionalAsync(ct);

        PagedResult<Appointment> result = await appointments.ListPendingAsync(own, page, ct);

        foreach (Appointment appointment in result.Items)
        {
            access.LogIfSensitive(appointment, "read_pending");
        }

        if (result.Items.Any(a => a.IsSensitive))
        {
            await unitOfWork.SaveChangesAsync(ct);
        }

        return new PagedResult<AppointmentResponse>([.. result.Items.Select(AppointmentConverter.ToResponse)], result.Page, result.PageSize, result.TotalCount);
    }
}

public sealed class ListMyAppointmentsQuery(IAppointmentRepository appointments, IPeopleDirectory people, IActorContext actor)
{
    public async Task<PagedResult<AppointmentResponse>> ExecuteAsync(PageRequest page, CancellationToken ct = default)
    {
        Guid? customerId = await people.FindCustomerIdAsync(actor.RequireUserId(), ct);

        if (customerId is not Guid id)
        {
            return new PagedResult<AppointmentResponse>([], Math.Max(1, page.Page), page.PageSize, 0);
        }

        PagedResult<Appointment> result = await appointments.ListForCustomerAsync(id, page, ct);
        return new PagedResult<AppointmentResponse>([.. result.Items.Select(AppointmentConverter.ToResponse)], result.Page, result.PageSize, result.TotalCount);
    }
}
