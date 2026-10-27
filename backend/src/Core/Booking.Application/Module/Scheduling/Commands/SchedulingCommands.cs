using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Availability;
using Booking.Application.Contracts.Catalog;
using Booking.Application.Contracts.Compliance;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Scheduling.Converter;
using Booking.Arguments.Module.Scheduling;
using Booking.Domain.Entity.Module.Scheduling;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Scheduling;

namespace Booking.Application.Module.Scheduling.Commands;

/// <summary>
/// Confere o horário contra a disponibilidade calculada e grava. A disputa entre dois pedidos simultâneos
/// não é resolvida aqui: é a constraint do banco que recusa o segundo, e o erro vira 409 com alternativas.
/// </summary>
public sealed class SlotGuard(IAvailabilityService availability, IBusinessDirectory businesses)
{
    private const int _maxAlternatives = 5;

    public async Task EnsureAvailableAsync(BookableService service, DateTimeOffset startsAt, bool ignoreLeadTime, CancellationToken ct)
    {
        IReadOnlyList<DateTimeOffset> slots = await SlotsOfDayAsync(service, startsAt, ignoreLeadTime, ct);

        if (!slots.Contains(startsAt.ToUniversalTime()))
        {
            throw Conflict(slots, startsAt);
        }
    }

    public async Task<DomainException> ConflictAsync(BookableService service, DateTimeOffset startsAt, bool ignoreLeadTime, CancellationToken ct) =>
        Conflict(await SlotsOfDayAsync(service, startsAt, ignoreLeadTime, ct), startsAt);

    private async Task<IReadOnlyList<DateTimeOffset>> SlotsOfDayAsync(BookableService service, DateTimeOffset startsAt, bool ignoreLeadTime, CancellationToken ct)
    {
        BusinessSchedulingInfo business = await businesses.GetSchedulingInfoAsync(service.BusinessId, ct)
            ?? throw new DomainException("business.not_found");

        TimeZoneInfo zone = TimeZoneInfo.FindSystemTimeZoneById(business.TimeZone);
        DateOnly localDate = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(startsAt, zone).DateTime);

        return await availability.GetSlotStartsAsync(
            new SlotQuery(
                service.BusinessId, service.ProfessionalId, localDate, service.DurationMinutes,
                service.BufferBeforeMinutes, service.BufferAfterMinutes, service.SlotStepMinutes, ignoreLeadTime),
            ct);
    }

    private static DomainException Conflict(IReadOnlyList<DateTimeOffset> slots, DateTimeOffset requested) =>
        new(
            "appointment.slot_no_longer_available",
            new Dictionary<string, object?>
            {
                ["alternatives"] = slots.OrderBy(s => (s - requested).Duration()).Take(_maxAlternatives).Order().ToList(),
            });
}

public sealed class RequestAppointmentCommand(
    IAppointmentRepository appointments,
    IBusinessDirectory businesses,
    IServiceCatalog catalog,
    IPeopleDirectory people,
    IComplianceGateway compliance,
    SlotGuard slots,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<AppointmentResponse> ExecuteAsync(RequestAppointmentRequest r, CancellationToken ct = default)
    {
        Guid userId = actor.RequireUserId();

        Guid customerId = await people.FindCustomerIdAsync(userId, ct)
            ?? throw new DomainException("customer.profile_required");

        if (await FindSameRequestAsync(customerId, r.IdempotencyKey, ct) is Appointment existing)
        {
            return AppointmentConverter.ToResponse(existing);
        }

        BusinessSchedulingInfo business = await businesses.GetSchedulingInfoAsync(r.BusinessId, ct)
            ?? throw new DomainException("business.not_found");

        if (!business.IsBookable)
        {
            throw new DomainException("business.not_found");
        }

        // Categoria sensível: sem consentimento específico vigente, a operação é recusada — bloqueio, não aviso.
        if (business.RequiresSensitiveHandling && !await compliance.HasSensitiveSchedulingConsentAsync(userId, ct))
        {
            throw new DomainException("compliance.consent_required");
        }

        BookableService service = await catalog.GetBookableAsync(r.BusinessId, r.ServiceId, r.ProfessionalId, ct)
            ?? throw new DomainException("service.not_found");

        try
        {
            await slots.EnsureAvailableAsync(service, r.StartsAt, ignoreLeadTime: false, ct);
        }
        catch (DomainException e) when (e.Code == "appointment.slot_no_longer_available")
        {
            // A requisição com a mesma chave pode ter gravado entre a conferência do início e esta: o horário
            // ocupado é o do próprio pedido, e a resposta é ele, não um 409.
            if (await FindSameRequestAsync(customerId, r.IdempotencyKey, ct) is Appointment same)
            {
                return AppointmentConverter.ToResponse(same);
            }

            throw;
        }

        Appointment appointment = Appointment.Request(
            r.BusinessId,
            r.ProfessionalId,
            customerId,
            new ServiceSnapshot(service.ServiceId, service.Name, service.DurationMinutes, service.BufferBeforeMinutes, service.BufferAfterMinutes, service.PriceCents),
            r.StartsAt,
            new BookingPolicy(business.AutoConfirm, business.PendingExpirationHours, business.MinLeadTimeHours),
            business.RequiresSensitiveHandling,
            new SchedulingActor(userId, "Customer"),
            clock.GetUtcNow(),
            r.Notes,
            r.AttendeeName,
            r.IdempotencyKey);

        appointments.Add(appointment);

        try
        {
            await unitOfWork.SaveChangesAsync(ct);
        }
        catch (DomainException e) when (e.Code is "appointment.slot_no_longer_available" or "appointment.duplicate_request")
        {
            appointments.Discard(appointment);

            // Toque duplo que passou junto pela conferência acima: outra requisição com a mesma chave gravou
            // primeiro. A resposta é o agendamento dela, não um erro. A recusa pode vir do índice de
            // idempotência ou da constraint de horário — a que o banco checar primeiro.
            if (await FindSameRequestAsync(customerId, r.IdempotencyKey, ct) is Appointment winner)
            {
                return AppointmentConverter.ToResponse(winner);
            }

            if (e.Code == "appointment.duplicate_request")
            {
                throw;
            }

            throw await slots.ConflictAsync(service, r.StartsAt, ignoreLeadTime: false, ct);
        }

        return AppointmentConverter.ToResponse(appointment);
    }

    private async Task<Appointment?> FindSameRequestAsync(Guid customerId, string? idempotencyKey, CancellationToken ct) =>
        string.IsNullOrWhiteSpace(idempotencyKey)
            ? null
            : await appointments.FindByIdempotencyKeyAsync(customerId, idempotencyKey.Trim(), ct);
}

/// <summary>Marcação de balcão: proprietário em qualquer agenda, profissional só na própria.</summary>
public sealed class CreateCounterAppointmentCommand(
    IAppointmentRepository appointments,
    IBusinessDirectory businesses,
    IServiceCatalog catalog,
    AppointmentAccess access,
    SlotGuard slots,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<AppointmentResponse> ExecuteAsync(CounterAppointmentRequest r, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireBusinessId();

        if (await access.RestrictToProfessionalAsync(ct) is Guid own && own != r.ProfessionalId)
        {
            throw new DomainException("auth.forbidden");
        }

        BusinessSchedulingInfo business = await businesses.GetSchedulingInfoAsync(businessId, ct)
            ?? throw new DomainException("business.not_found");

        BookableService service = await catalog.GetBookableAsync(businessId, r.ServiceId, r.ProfessionalId, ct)
            ?? throw new DomainException("service.not_found");

        await slots.EnsureAvailableAsync(service, r.StartsAt, ignoreLeadTime: true, ct);

        Appointment appointment = Appointment.AtCounter(
            businessId,
            r.ProfessionalId,
            new ServiceSnapshot(service.ServiceId, service.Name, service.DurationMinutes, service.BufferBeforeMinutes, service.BufferAfterMinutes, service.PriceCents),
            r.StartsAt,
            business.RequiresSensitiveHandling,
            r.WalkInName,
            r.WalkInPhone,
            r.Notes,
            access.CurrentActor(),
            clock.GetUtcNow());

        appointments.Add(appointment);

        try
        {
            await unitOfWork.SaveChangesAsync(ct);
        }
        catch (DomainException e) when (e.Code == "appointment.slot_no_longer_available")
        {
            throw await slots.ConflictAsync(service, r.StartsAt, ignoreLeadTime: true, ct);
        }

        return AppointmentConverter.ToResponse(appointment);
    }
}

/// <summary>Transições do lado do estabelecimento: aceitar, recusar, cancelar, concluir, marcar falta.</summary>
public sealed class ManageAppointmentCommand(AppointmentAccess access, IUnitOfWork unitOfWork, TimeProvider clock)
{
    public Task<AppointmentResponse> ConfirmAsync(Guid id, CancellationToken ct = default) =>
        RunAsync(id, "confirm", (a, actor, now) => a.Confirm(actor, now), ct);

    public Task<AppointmentResponse> RejectAsync(Guid id, string? reason, CancellationToken ct = default) =>
        RunAsync(id, "reject", (a, actor, now) => a.Reject(actor, now, reason), ct);

    public Task<AppointmentResponse> CancelAsync(Guid id, string? reason, CancellationToken ct = default) =>
        RunAsync(id, "cancel", (a, actor, now) => a.CancelByBusiness(actor, now, reason), ct);

    public Task<AppointmentResponse> CompleteAsync(Guid id, CancellationToken ct = default) =>
        RunAsync(id, "complete", (a, actor, now) => a.Complete(actor, now), ct);

    public Task<AppointmentResponse> MarkNoShowAsync(Guid id, CancellationToken ct = default) =>
        RunAsync(id, "no_show", (a, actor, now) => a.MarkNoShow(actor, now), ct);

    private async Task<AppointmentResponse> RunAsync(
        Guid id, string action, Action<Appointment, SchedulingActor, DateTimeOffset> transition, CancellationToken ct)
    {
        Appointment appointment = await access.LoadAsync(id, action, ct);

        transition(appointment, access.CurrentActor(), clock.GetUtcNow());

        await unitOfWork.SaveChangesAsync(ct);
        return AppointmentConverter.ToResponse(appointment);
    }
}

public sealed class CancelMyAppointmentCommand(
    IAppointmentRepository appointments,
    IBusinessDirectory businesses,
    IPeopleDirectory people,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<AppointmentResponse> ExecuteAsync(Guid appointmentId, string? reason, CancellationToken ct = default)
    {
        Guid userId = actor.RequireUserId();

        Guid customerId = await people.FindCustomerIdAsync(userId, ct)
            ?? throw new DomainException("appointment.not_found");

        Appointment appointment = await appointments.GetForCustomerAsync(appointmentId, customerId, ct)
            ?? throw new DomainException("appointment.not_found");

        BusinessSchedulingInfo business = await businesses.GetSchedulingInfoAsync(appointment.BusinessId, ct)
            ?? throw new DomainException("business.not_found");

        appointment.CancelByCustomer(new SchedulingActor(userId, "Customer"), clock.GetUtcNow(), business.CancellationWindowHours, reason);

        await unitOfWork.SaveChangesAsync(ct);
        return AppointmentConverter.ToResponse(appointment);
    }
}

/// <summary>Expira pedidos pendentes vencidos, em lotes. Roda fora de requisição, sem tenant no contexto.</summary>
public sealed class ExpirePendingAppointmentsCommand(IAppointmentRepository appointments, IUnitOfWork unitOfWork, TimeProvider clock)
{
    private const int _batchSize = 200;

    public async Task<int> ExecuteAsync(CancellationToken ct = default)
    {
        DateTimeOffset now = clock.GetUtcNow();
        IReadOnlyList<Appointment> expired = await appointments.ListExpiredPendingAsync(now, _batchSize, ct);

        foreach (Appointment appointment in expired)
        {
            appointment.Expire(now);
        }

        await unitOfWork.SaveChangesAsync(ct);
        return expired.Count;
    }
}
