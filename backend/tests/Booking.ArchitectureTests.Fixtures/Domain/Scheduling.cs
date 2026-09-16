using Booking.Domain.Base;

namespace Booking.Domain.Module.Scheduling;

public sealed class Appointment : BaseEntity;

/// <summary>
/// ✗ Decisão 2 — Appointment tem máquina de estados. Update genérico deixaria trocar o Status direto,
/// sem passar por Confirm/Reject/Cancel, e Remove apagaria o histórico do snapshot.
/// </summary>
public interface IAppointmentRepository : IBaseRepository<Appointment>
{
}
