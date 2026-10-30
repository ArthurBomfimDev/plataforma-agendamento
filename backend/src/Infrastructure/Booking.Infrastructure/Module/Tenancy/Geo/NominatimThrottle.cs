using Microsoft.Extensions.Options;

namespace Booking.Infrastructure.Module.Tenancy.Geo;

/// <summary>
/// Fila de horários para o Nominatim: cada chamada reserva o próximo horário livre, a pelo menos
/// <see cref="NominatimOptions.MinIntervalMilliseconds"/> do anterior, e espera por ele. Vale para a instância inteira
/// (singleton). Com mais de uma instância da API, o limite do provedor é dividido por elas — registrado na ADR-022.
/// </summary>
public sealed class NominatimThrottle(TimeProvider clock, IOptions<GeoOptions> options)
{
    private readonly Lock _lock = new();
    private DateTimeOffset _next = DateTimeOffset.MinValue;

    public async Task WaitTurnAsync(CancellationToken ct)
    {
        TimeSpan interval = TimeSpan.FromMilliseconds(Math.Max(0, options.Value.Nominatim.MinIntervalMilliseconds));
        TimeSpan wait;

        lock (_lock)
        {
            DateTimeOffset now = clock.GetUtcNow();
            DateTimeOffset slot = _next > now ? _next : now;
            _next = slot + interval;
            wait = slot - now;
        }

        if (wait > TimeSpan.Zero)
        {
            await Task.Delay(wait, clock, ct);
        }
    }
}
