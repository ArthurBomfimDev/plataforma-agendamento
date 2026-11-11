using Booking.Application.Module.Scheduling.Commands;

namespace Booking.Api.Common;

/// <summary>
/// Envia os lembretes de 24 h e 1 h a cada minuto (C1). Um processo só, como os outros workers. Falha de uma rodada é
/// registrada e a próxima tenta de novo; a marca de "enviado" só é gravada junto com o e-mail na outbox, então repetir não
/// duplica.
/// </summary>
public sealed class AppointmentReminderWorker(IServiceScopeFactory scopes, ILogger<AppointmentReminderWorker> logger) : BackgroundService
{
    private static readonly TimeSpan _interval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_interval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await using AsyncServiceScope scope = scopes.CreateAsyncScope();
                int queued = await scope.ServiceProvider.GetRequiredService<SendAppointmentRemindersCommand>().ExecuteAsync(stoppingToken);

                if (queued > 0)
                {
                    logger.LogInformation("{Count} lembretes enfileirados.", queued);
                }
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                logger.LogError(e, "Falha ao enviar lembretes de agendamento.");
            }
        }
    }
}
