using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Module.Scheduling.Converter;
using Booking.Domain.Entity.Module.Scheduling;
using Booking.Domain.Enum.Module.Scheduling;
using Booking.Domain.Interface.Repository.Module.Scheduling;

namespace Booking.Application.Module.Scheduling.Commands;

/// <summary>
/// Lembretes ao consumidor, 24 h e 1 h antes (C1). Roda fora de requisição, a cada minuto, sem tenant no contexto.
/// </summary>
/// <remarks>
/// <b>Sem duplicar nem mandar para quem não deve.</b> A condição do lembrete é conferida no domínio (<c>ReminderDue</c>):
/// só confirmado, com conta, antes do horário e uma vez só. O e-mail entra na outbox e a marca de "enviado" no agendamento
/// é gravada no <b>mesmo</b> <c>SaveChanges</c>: se o processo cair, ou as duas coisas existem, ou nenhuma, e a rodada
/// seguinte vê a marca. Pedido cancelado, recusado ou expirado deixa de ser confirmado e sai da consulta.
///
/// <b>Orçamento.</b> Só este comando consulta o teto diário de e-mail (<see cref="IAppointmentNotifier.ReminderBudgetLeftAsync"/>):
/// o lote nunca passa do que cabe, e o que sobra espera a próxima rodada, sem marca. Os outros avisos não passam por aqui.
/// </remarks>
public sealed class SendAppointmentRemindersCommand(
    IAppointmentRepository appointments, IAppointmentNotifier notifier, IUnitOfWork unitOfWork, TimeProvider clock)
{
    private const int _batchSize = 200;

    /// <summary>Devolve quantos lembretes foram enfileirados.</summary>
    public async Task<int> ExecuteAsync(CancellationToken ct = default)
    {
        int room = Math.Min(_batchSize, await notifier.ReminderBudgetLeftAsync(ct));

        if (room == 0)
        {
            return 0;
        }

        DateTimeOffset now = clock.GetUtcNow();
        IReadOnlyList<Appointment> due = await appointments.ListWithReminderDueAsync(now, room, ct);
        int queued = 0;

        foreach (Appointment appointment in due)
        {
            if (appointment.ReminderDue(now) is not ReminderKind kind)
            {
                continue;
            }

            AppointmentReminder reminder = kind == ReminderKind.HourBefore ? AppointmentReminder.HourBefore : AppointmentReminder.DayBefore;

            // Sem para quem mandar (conta inativa): a marca sai assim mesmo, senão a consulta devolveria o mesmo a cada minuto.
            if (await notifier.NotifyReminderAsync(AppointmentConverter.ToFacts(appointment), reminder, ct))
            {
                queued++;
            }

            appointment.MarkReminderSent(kind, now);
        }

        await unitOfWork.SaveChangesAsync(ct);
        return queued;
    }
}
