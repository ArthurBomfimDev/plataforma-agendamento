using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Scheduling;
using Booking.Domain.Exceptions;
using Booking.Domain.ValueObject;

namespace Booking.Domain.Entity.Module.Scheduling;

/// <summary>Cópia do serviço no momento do pedido. Reajuste de tabela não reescreve o histórico.</summary>
public sealed record ServiceSnapshot(Guid ServiceId, string Name, int DurationMinutes, int BufferBeforeMinutes, int BufferAfterMinutes, long PriceCents);

/// <summary>Política do estabelecimento que o agendamento precisa no momento do pedido.</summary>
public sealed record BookingPolicy(bool AutoConfirm, int PendingExpirationHours, int MinLeadTimeHours);

/// <summary>
/// O agendamento. A garantia contra sobreposição não está aqui: está na constraint de exclusão do banco
/// (ADR-005), que vale para qualquer caminho de escrita. Esta classe garante a máquina de estados.
/// </summary>
public sealed class Appointment : AggregateRoot, IAuditable, ITenantScoped
{
    private readonly List<AppointmentEvent> _history = [];

    public Guid BusinessId { get; private set; }
    public Guid ProfessionalId { get; private set; }
    public Guid ServiceId { get; private set; }

    /// <summary>Nulo na marcação de balcão para quem não tem conta.</summary>
    public Guid? CustomerId { get; private set; }

    /// <summary>Balcão sem conta, ou atendimento para outra pessoa (o menor agendado pela conta de um adulto).</summary>
    public string? WalkInName { get; private set; }
    public string? WalkInPhone { get; private set; }

    /// <summary>Início e fim do atendimento em si, UTC. Os buffers ficam fora e entram só no intervalo bloqueado.</summary>
    public DateTimeOffset StartsAt { get; private set; }
    public DateTimeOffset EndsAt { get; private set; }

    /// <summary>
    /// Intervalo que a constraint de exclusão compara: buffer antes + atendimento + buffer depois. Gravado,
    /// e não coluna gerada: <c>timestamptz - interval</c> é STABLE no PostgreSQL e coluna gerada exige IMMUTABLE.
    /// </summary>
    public DateTimeOffset BlockedStartsAt { get; private set; }
    public DateTimeOffset BlockedEndsAt { get; private set; }

    // --- Snapshot ---
    public string ServiceNameSnapshot { get; private set; } = null!;
    public int DurationMinutes { get; private set; }
    public int BufferBeforeMinutes { get; private set; }
    public int BufferAfterMinutes { get; private set; }
    public long PriceCents { get; private set; }

    /// <summary>Categoria sensível no momento do pedido (LGPD, Art. 11): decide log de acesso e exposição.</summary>
    public bool IsSensitive { get; private set; }

    public AppointmentStatus Status { get; private set; }
    public AppointmentSource Source { get; private set; }
    public string? CustomerNotes { get; private set; }
    public string? BusinessNotes { get; private set; }
    public DateTimeOffset RequestedAt { get; private set; }
    public DateTimeOffset? ConfirmedAt { get; private set; }
    public DateTimeOffset? CancelledAt { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }
    public CancellationParty? CancelledBy { get; private set; }
    public string? CancellationReason { get; private set; }

    /// <summary>Só enquanto pendente.</summary>
    public DateTimeOffset? ExpiresAt { get; private set; }

    /// <summary>Chave gerada pelo cliente: toque duplo e retry devolvem o mesmo agendamento.</summary>
    public string? IdempotencyKey { get; private set; }

    public IReadOnlyCollection<AppointmentEvent> History => _history.AsReadOnly();

    private Appointment()
    {
    }

    /// <summary>Pedido do consumidor. Pendente por padrão; confirmado direto com autoconfirmação ligada.</summary>
    public static Appointment Request(
        Guid businessId,
        Guid professionalId,
        Guid customerId,
        ServiceSnapshot service,
        DateTimeOffset startsAt,
        BookingPolicy policy,
        bool isSensitive,
        SchedulingActor actor,
        DateTimeOffset now,
        string? customerNotes,
        string? attendeeName,
        string? idempotencyKey)
    {
        Appointment appointment = Build(businessId, professionalId, service, startsAt, isSensitive, AppointmentSource.Online, now);
        appointment.CustomerId = customerId;
        appointment.WalkInName = Clean(attendeeName);
        appointment.CustomerNotes = Clean(customerNotes);
        appointment.IdempotencyKey = Clean(idempotencyKey);

        if (policy.AutoConfirm)
        {
            appointment.Status = AppointmentStatus.Confirmed;
            appointment.ConfirmedAt = now;
        }
        else
        {
            appointment.Status = AppointmentStatus.Pending;

            // Expira no prazo de resposta ou na antecedência mínima — o que vier primeiro.
            DateTimeOffset byDeadline = now.AddHours(policy.PendingExpirationHours);
            DateTimeOffset byLeadTime = startsAt.AddHours(-policy.MinLeadTimeHours);
            appointment.ExpiresAt = byDeadline < byLeadTime ? byDeadline : byLeadTime;
        }

        appointment.Track(null, appointment.Status, actor, now, null);
        return appointment;
    }

    /// <summary>Marcação de balcão: nasce confirmada, sem antecedência mínima.</summary>
    public static Appointment AtCounter(
        Guid businessId,
        Guid professionalId,
        ServiceSnapshot service,
        DateTimeOffset startsAt,
        bool isSensitive,
        string walkInName,
        string? walkInPhone,
        string? businessNotes,
        SchedulingActor actor,
        DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(walkInName))
        {
            throw new DomainException("appointment.walk_in_name_required");
        }

        Appointment appointment = Build(businessId, professionalId, service, startsAt, isSensitive, AppointmentSource.Counter, now);
        appointment.WalkInName = walkInName.Trim();
        appointment.WalkInPhone = Clean(walkInPhone);
        appointment.BusinessNotes = Clean(businessNotes);
        appointment.Status = AppointmentStatus.Confirmed;
        appointment.ConfirmedAt = now;

        appointment.Track(null, AppointmentStatus.Confirmed, actor, now, null);
        return appointment;
    }

    public TimeRange BlockedRange => TimeRange.Of(BlockedStartsAt, BlockedEndsAt);

    public static bool OccupiesSlot(AppointmentStatus status) =>
        status is AppointmentStatus.Pending or AppointmentStatus.Confirmed or AppointmentStatus.Completed or AppointmentStatus.NoShow;

    public void Confirm(SchedulingActor actor, DateTimeOffset now)
    {
        EnsureStatus(AppointmentStatus.Pending, "appointment.cannot_confirm_from_current_status");

        if (ExpiresAt is DateTimeOffset expiresAt && now >= expiresAt)
        {
            throw new DomainException("appointment.cannot_confirm_expired");
        }

        ConfirmedAt = now;
        ExpiresAt = null;
        Move(AppointmentStatus.Confirmed, actor, now, null);
    }

    public void Reject(SchedulingActor actor, DateTimeOffset now, string? reason)
    {
        EnsureStatus(AppointmentStatus.Pending, "appointment.cannot_reject_from_current_status");

        CancellationReason = Clean(reason);
        ExpiresAt = null;
        Move(AppointmentStatus.Rejected, actor, now, reason);
    }

    public void Expire(DateTimeOffset now)
    {
        EnsureStatus(AppointmentStatus.Pending, "appointment.cannot_expire_from_current_status");

        if (ExpiresAt is not DateTimeOffset expiresAt || now < expiresAt)
        {
            throw new DomainException("appointment.cannot_expire_before_deadline");
        }

        ExpiresAt = null;
        CancelledBy = CancellationParty.System;
        Move(AppointmentStatus.Expired, SchedulingActor.System, now, null);
    }

    /// <summary>Pendente: o consumidor desiste quando quiser. Confirmado: só até a janela de cancelamento.</summary>
    public void CancelByCustomer(SchedulingActor actor, DateTimeOffset now, int cancellationWindowHours, string? reason)
    {
        if (Status == AppointmentStatus.Confirmed && now > StartsAt.AddHours(-cancellationWindowHours))
        {
            throw new DomainException("appointment.cannot_cancel_inside_window");
        }

        if (Status is not (AppointmentStatus.Pending or AppointmentStatus.Confirmed))
        {
            throw new DomainException("appointment.cannot_cancel_from_current_status");
        }

        Cancel(CancellationParty.Customer, actor, now, reason);
    }

    /// <summary>O estabelecimento cancela sempre, mas só o que já confirmou — pedido pendente se recusa.</summary>
    public void CancelByBusiness(SchedulingActor actor, DateTimeOffset now, string? reason)
    {
        EnsureStatus(AppointmentStatus.Confirmed, "appointment.cannot_cancel_from_current_status");
        Cancel(CancellationParty.Business, actor, now, reason);
    }

    public void Complete(SchedulingActor actor, DateTimeOffset now)
    {
        EnsureFinishable(now, "appointment.cannot_complete_from_current_status");
        CompletedAt = now;
        Move(AppointmentStatus.Completed, actor, now, null);
    }

    public void MarkNoShow(SchedulingActor actor, DateTimeOffset now)
    {
        EnsureFinishable(now, "appointment.cannot_mark_no_show_from_current_status");
        Move(AppointmentStatus.NoShow, actor, now, null);
    }

    private static Appointment Build(
        Guid businessId, Guid professionalId, ServiceSnapshot service, DateTimeOffset startsAt, bool isSensitive, AppointmentSource source, DateTimeOffset now)
    {
        if (service.DurationMinutes <= 0)
        {
            throw new DomainException("appointment.duration_invalid");
        }

        DateTimeOffset start = startsAt.ToUniversalTime();

        return new Appointment
        {
            BusinessId = businessId,
            ProfessionalId = professionalId,
            ServiceId = service.ServiceId,
            StartsAt = start,
            EndsAt = start.AddMinutes(service.DurationMinutes),
            BlockedStartsAt = start.AddMinutes(-service.BufferBeforeMinutes),
            BlockedEndsAt = start.AddMinutes(service.DurationMinutes + service.BufferAfterMinutes),
            ServiceNameSnapshot = service.Name,
            DurationMinutes = service.DurationMinutes,
            BufferBeforeMinutes = service.BufferBeforeMinutes,
            BufferAfterMinutes = service.BufferAfterMinutes,
            PriceCents = service.PriceCents,
            IsSensitive = isSensitive,
            Source = source,
            RequestedAt = now,
        };
    }

    private void Cancel(CancellationParty party, SchedulingActor actor, DateTimeOffset now, string? reason)
    {
        CancelledAt = now;
        CancelledBy = party;
        CancellationReason = Clean(reason);
        ExpiresAt = null;
        Move(AppointmentStatus.Cancelled, actor, now, reason);
    }

    // Concluído e falta só depois do fim: são passado, e o passado não se marca adiantado.
    private void EnsureFinishable(DateTimeOffset now, string code)
    {
        if (Status != AppointmentStatus.Confirmed || now < EndsAt)
        {
            throw new DomainException(code);
        }
    }

    private void EnsureStatus(AppointmentStatus expected, string code)
    {
        if (Status != expected)
        {
            throw new DomainException(code);
        }
    }

    private void Move(AppointmentStatus to, SchedulingActor actor, DateTimeOffset now, string? note)
    {
        AppointmentStatus from = Status;
        Status = to;
        Track(from, to, actor, now, note);
    }

    private void Track(AppointmentStatus? from, AppointmentStatus to, SchedulingActor actor, DateTimeOffset now, string? note) =>
        _history.Add(AppointmentEvent.Record(BusinessId, Id, from, to, actor, now, Clean(note)));

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
