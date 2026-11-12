using Booking.Application.Module.Notifications.Commands;

namespace Booking.Api.Common;

/// <summary>
/// Apaga os avisos antigos do sino uma vez por dia (e logo na subida). Um processo só, como os outros workers. Falha de uma
/// rodada é registrada e a próxima tenta de novo; apagar de novo o que já saiu não muda nada.
/// </summary>
public sealed class NotificationRetentionWorker(IServiceScopeFactory scopes, ILogger<NotificationRetentionWorker> logger) : BackgroundService
{
    private static readonly TimeSpan _interval = TimeSpan.FromHours(24);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_interval);

        do
        {
            try
            {
                await using AsyncServiceScope scope = scopes.CreateAsyncScope();
                int purged = await scope.ServiceProvider.GetRequiredService<PurgeOldNotificationsCommand>().ExecuteAsync(stoppingToken);

                if (purged > 0)
                {
                    logger.LogInformation("{Count} avisos antigos do sino apagados.", purged);
                }
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                logger.LogError(e, "Falha ao apagar avisos antigos do sino.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
