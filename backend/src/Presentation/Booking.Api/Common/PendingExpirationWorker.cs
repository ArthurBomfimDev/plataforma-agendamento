using Booking.Application.Module.Scheduling.Commands;

namespace Booking.Api.Common;

/// <summary>
/// Expira pedidos pendentes vencidos a cada minuto. Um processo só (monólito modular): não precisa de
/// fila nem de agendador externo. Falha de uma rodada é registrada e a próxima tenta de novo.
/// </summary>
public sealed class PendingExpirationWorker(IServiceScopeFactory scopes, ILogger<PendingExpirationWorker> logger) : BackgroundService
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
                int expired = await scope.ServiceProvider.GetRequiredService<ExpirePendingAppointmentsCommand>().ExecuteAsync(stoppingToken);

                if (expired > 0)
                {
                    logger.LogInformation("{Count} pedidos pendentes expirados.", expired);
                }
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                logger.LogError(e, "Falha ao expirar pedidos pendentes.");
            }
        }
    }
}
