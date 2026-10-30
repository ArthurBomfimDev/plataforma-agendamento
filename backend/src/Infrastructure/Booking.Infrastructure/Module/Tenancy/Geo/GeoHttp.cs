using System.Net;
using Booking.Domain.Exceptions;

namespace Booking.Infrastructure.Module.Tenancy.Geo;

/// <summary>
/// Envio com uma nova tentativa só, para falha transitória (rede, tempo esgotado, 5xx, 429). Depois disso o erro
/// vira <c>geo.provider_unavailable</c> (503), sem a URL: ela leva o texto ou o ponto consultado.
/// </summary>
internal static class GeoHttp
{
    private static readonly TimeSpan _retryDelay = TimeSpan.FromMilliseconds(500);

    public static async Task<HttpResponseMessage> SendAsync(
        HttpClient client,
        Func<HttpRequestMessage> request,
        CancellationToken ct,
        Func<CancellationToken, Task>? beforeEachAttempt = null)
    {
        for (int attempt = 1; ; attempt++)
        {
            if (beforeEachAttempt is not null)
            {
                await beforeEachAttempt(ct);
            }

            HttpResponseMessage? response = null;
            try
            {
                using HttpRequestMessage message = request();
                response = await client.SendAsync(message, HttpCompletionOption.ResponseContentRead, ct);

                if (!IsTransient(response.StatusCode))
                {
                    return response;
                }
            }
            catch (HttpRequestException)
            {
            }
            catch (TaskCanceledException) when (!ct.IsCancellationRequested)
            {
                // Tempo esgotado (HttpClient.Timeout), não cancelamento de quem chamou.
            }

            response?.Dispose();

            if (attempt == 2)
            {
                throw new DomainException("geo.provider_unavailable");
            }

            await Task.Delay(_retryDelay, ct);
        }
    }

    private static bool IsTransient(HttpStatusCode status) =>
        (int)status >= 500 || status == HttpStatusCode.TooManyRequests || status == HttpStatusCode.RequestTimeout;
}
