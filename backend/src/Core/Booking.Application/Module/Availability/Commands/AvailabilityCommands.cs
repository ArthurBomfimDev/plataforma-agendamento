using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Scheduling;
using Booking.Application.Module.Availability.Converter;
using Booking.Arguments.Module.Availability;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Availability;
using Booking.Domain.Enum.Module.Availability;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Availability;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Availability.Commands;

/// <summary>Jornada, bloqueios e férias: só o proprietário edita (matriz de permissões).</summary>
public sealed class AddWorkScheduleCommand(
    IWorkScheduleRepository schedules,
    IPeopleDirectory people,
    IActorContext actor,
    IUnitOfWork unitOfWork)
{
    public async Task<WorkScheduleResponse> ExecuteAsync(AddWorkScheduleRequest r, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireOwner();

        if (await people.GetProfessionalAsync(businessId, r.ProfessionalId, ct) is null)
        {
            throw new DomainException("professional.not_found");
        }

        WorkSchedule schedule = WorkSchedule.Create(businessId, r.ProfessionalId, r.DayOfWeek, r.StartTime, r.EndTime, r.EffectiveFrom, r.EffectiveTo);

        IReadOnlyList<WorkSchedule> existing = await schedules.ListOfProfessionalAsync(businessId, r.ProfessionalId, ct);

        if (existing.Any(schedule.ConflictsWith))
        {
            throw new DomainException("work_schedule.overlaps");
        }

        schedules.Add(schedule);
        await unitOfWork.SaveChangesAsync(ct);

        return AvailabilityConverter.ToResponse(schedule);
    }
}

/// <summary>
/// Edição da jornada, com a mesma invariante da criação (<c>work_schedule.overlaps</c>). Não mexe em agendamento
/// já marcado: um pedido que fique fora da jornada nova continua de pé, como no bloqueio com "manter".
/// </summary>
public sealed class UpdateWorkScheduleCommand(IWorkScheduleRepository schedules, IActorContext actor, IUnitOfWork unitOfWork)
{
    public async Task<WorkScheduleResponse> ExecuteAsync(Guid scheduleId, UpdateWorkScheduleRequest r, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireOwner();

        // Filtro de tenant: jornada de outro estabelecimento não existe para este dono (404).
        WorkSchedule schedule = await schedules.GetByIdAsync(scheduleId, ct) ?? throw new DomainException("work_schedule.not_found");

        schedule.Update(r.DayOfWeek, r.StartTime, r.EndTime, r.EffectiveFrom, r.EffectiveTo);

        IReadOnlyList<WorkSchedule> others = await schedules.ListOfProfessionalAsync(businessId, schedule.ProfessionalId, ct);

        if (others.Any(schedule.ConflictsWith))
        {
            throw new DomainException("work_schedule.overlaps");
        }

        await unitOfWork.SaveChangesAsync(ct);
        return AvailabilityConverter.ToResponse(schedule);
    }
}

public sealed class RemoveWorkScheduleCommand(IWorkScheduleRepository schedules, IActorContext actor, IUnitOfWork unitOfWork)
{
    public async Task ExecuteAsync(Guid scheduleId, CancellationToken ct = default)
    {
        actor.RequireOwner();

        WorkSchedule schedule = await schedules.GetByIdAsync(scheduleId, ct) ?? throw new DomainException("work_schedule.not_found");

        schedules.Remove(schedule);
        await unitOfWork.SaveChangesAsync(ct);
    }
}

/// <summary>
/// Bloqueio de período. Quando há agendamentos dentro dele, o dono escolhe (PROJECT-CONTEXT §5): manter os
/// existentes (padrão) ou cancelar todos. "Voltar e ajustar" é a tela não enviar — ela consulta a prévia antes.
/// Com "cancelar todos", o bloqueio e os cancelamentos são gravados no mesmo <c>SaveChanges</c>: tudo ou nada.
/// </summary>
/// <remarks>
/// Não há aviso ao consumidor: o módulo de notificações está fora do recorte. O cancelamento aparece em
/// "Meus agendamentos" pelo estado e pelo motivo.
/// </remarks>
public sealed class AddScheduleExceptionCommand(
    IScheduleExceptionRepository exceptions,
    IPeopleDirectory people,
    IAffectedAppointments affected,
    IActorContext actor,
    IUnitOfWork unitOfWork)
{
    public async Task<ScheduleExceptionResponse> ExecuteAsync(AddScheduleExceptionRequest r, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireOwner();

        if (!System.Enum.TryParse(r.Kind, ignoreCase: true, out ScheduleExceptionKind kind))
        {
            throw new DomainException("schedule_exception.kind_invalid");
        }

        bool cancelAll = ParseChoice(r.ExistingAppointments);

        if (cancelAll && kind == ScheduleExceptionKind.ExtraShift)
        {
            // Turno extra soma horário: não há agendamento para tirar do caminho.
            throw new DomainException("schedule_exception.cancel_requires_block");
        }

        if (cancelAll && string.IsNullOrWhiteSpace(r.CancellationReason))
        {
            throw new DomainException("schedule_exception.cancellation_reason_required");
        }

        if (r.ProfessionalId is Guid professionalId && await people.GetProfessionalAsync(businessId, professionalId, ct) is null)
        {
            throw new DomainException("professional.not_found");
        }

        ScheduleException exception = ScheduleException.Create(businessId, r.ProfessionalId, kind, TimeRange.Of(r.StartsAt, r.EndsAt), r.Reason);
        exceptions.Add(exception);

        int cancelled = cancelAll
            ? await affected.StageCancellationAsync(r.ProfessionalId, exception.StartsAt, exception.EndsAt, r.CancellationReason!.Trim(), ct)
            : 0;

        await unitOfWork.SaveChangesAsync(ct);

        return AvailabilityConverter.ToResponse(exception) with { CancelledAppointments = cancelled };
    }

    private static bool ParseChoice(string? choice) => choice?.Trim() switch
    {
        null or "" => false,
        _ when choice.Trim().Equals("Keep", StringComparison.OrdinalIgnoreCase) => false,
        _ when choice.Trim().Equals("CancelAll", StringComparison.OrdinalIgnoreCase) => true,
        _ => throw new DomainException("schedule_exception.existing_appointments_invalid"),
    };
}

public sealed class RemoveScheduleExceptionCommand(IScheduleExceptionRepository exceptions, IActorContext actor, IUnitOfWork unitOfWork)
{
    public async Task ExecuteAsync(Guid exceptionId, CancellationToken ct = default)
    {
        actor.RequireOwner();

        ScheduleException exception = await exceptions.GetByIdAsync(exceptionId, ct)
            ?? throw new DomainException("schedule_exception.not_found");

        exceptions.Remove(exception);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
