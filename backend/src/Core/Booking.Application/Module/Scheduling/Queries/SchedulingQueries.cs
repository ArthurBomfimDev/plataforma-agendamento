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
    CustomerNameResolver names,
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
        return await BusinessSideResponse.RespondAsync(result, "read_agenda", access, names, unitOfWork, ct);
    }

    private static DateTimeOffset LocalMidnightUtc(DateOnly date, TimeZoneInfo zone) =>
        new(TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Unspecified), zone), TimeSpan.Zero);
}

/// <summary>
/// Pendentes do estabelecimento. O proprietário vê todos ou filtra por profissional; o profissional vê só os
/// próprios, seja qual for o filtro pedido.
/// </summary>
public sealed class ListPendingAppointmentsQuery(
    IAppointmentRepository appointments, AppointmentAccess access, CustomerNameResolver names, IUnitOfWork unitOfWork)
{
    public async Task<PagedResult<AppointmentResponse>> ExecuteAsync(Guid? professionalId, PageRequest page, CancellationToken ct = default)
    {
        Guid? own = await access.RestrictToProfessionalAsync(ct);

        PagedResult<Appointment> result = await appointments.ListPendingAsync(own ?? professionalId, page, ct);
        return await BusinessSideResponse.RespondAsync(result, "read_pending", access, names, unitOfWork, ct);
    }
}

/// <summary>Resposta das listas do estabelecimento: registra a leitura sensível, persiste o registro e põe o nome.</summary>
internal static class BusinessSideResponse
{
    public static async Task<PagedResult<AppointmentResponse>> RespondAsync(
        PagedResult<Appointment> result, string action, AppointmentAccess access, CustomerNameResolver names, IUnitOfWork unitOfWork, CancellationToken ct)
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

        IReadOnlyDictionary<Guid, string?> customerNames = await names.ResolveAsync(result.Items, ct);

        return new PagedResult<AppointmentResponse>(
            [.. result.Items.Select(a => AppointmentConverter.ToResponse(a, customerNames[a.Id]))], result.Page, result.PageSize, result.TotalCount);
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

        // Lado do consumidor: sem CustomerName — é ele mesmo.
        return new PagedResult<AppointmentResponse>([.. result.Items.Select(a => AppointmentConverter.ToResponse(a))], result.Page, result.PageSize, result.TotalCount);
    }
}
