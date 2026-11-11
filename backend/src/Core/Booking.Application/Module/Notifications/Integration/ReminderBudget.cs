using Booking.Application.Module.Notifications.Email;
using Booking.Domain.Interface.Repository.Module.Notifications;

namespace Booking.Application.Module.Notifications.Integration;

/// <summary>
/// Quantos lembretes ainda cabem. O provedor de e-mail tem um limite diário (Gmail: cerca de 500, a conferir), e o
/// lembrete é o único e-mail que se pode adiar sem prejuízo: confirmação, redefinição de senha, convite e o resto nunca
/// consultam este número e enviam sempre. O orçamento conta <b>todo</b> e-mail gravado nas últimas 24 h (os críticos
/// também gastam a cota do provedor) e para os lembretes antes do teto, para a folga ficar reservada a eles.
/// </summary>
public sealed class ReminderBudget(IOutboxRepository outbox, NotificationSettings settings, TimeProvider clock)
{
    public static readonly TimeSpan Window = TimeSpan.FromHours(24);

    /// <summary>Quantos lembretes podem ser enfileirados agora. Zero ou mais, nunca negativo.</summary>
    public async Task<int> LeftAsync(CancellationToken ct = default)
    {
        int used = await outbox.CountCreatedSinceAsync(clock.GetUtcNow() - Window, ct);
        return Math.Max(0, settings.ReminderDailyEmailBudget - used);
    }
}
