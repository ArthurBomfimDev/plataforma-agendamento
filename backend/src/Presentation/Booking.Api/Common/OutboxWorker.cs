using Booking.Application.Module.Notifications.Commands;

namespace Booking.Api.Common;

/// <summary>
/// Envia o que está na outbox (ADR-021), a cada poucos segundos e fora de qualquer requisição. Lote cheio: roda de
/// novo na hora. Falha de uma rodada é registrada e a próxima tenta de novo; falha de uma entrega fica na própria
/// linha, com o recuo progressivo.
/// </summary>
public sealed class OutboxWorker(IServiceScopeFactory scopes, ILogger<OutboxWorker> logger) : BackgroundService
{
    private static readonly TimeSpan _interval = TimeSpan.FromSeconds(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_interval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                DispatchResult result;
                do
                {
                    await using AsyncServiceScope scope = scopes.CreateAsyncScope();
                    result = await scope.ServiceProvider.GetRequiredService<DispatchOutboxCommand>().ExecuteAsync(stoppingToken);

                    if (result.Failed > 0)
                    {
                        logger.LogWarning("Outbox: {Failed} de {Claimed} entregas falharam e vão ser tentadas de novo.", result.Failed, result.Claimed);
                    }
                }
                while (result.Claimed == DispatchOutboxCommand.BatchSize && !stoppingToken.IsCancellationRequested);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                logger.LogError(e, "Falha numa rodada da outbox.");
            }
        }
    }
}
