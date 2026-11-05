using System.Collections.Concurrent;
using System.Net;
using System.Text;

namespace Booking.IntegrationTests.Infrastructure;

/// <summary>Uma chamada que o adaptador de geocodificação ou de CEP tentou fazer.</summary>
public sealed record GeoCall(Uri Uri, string? UserAgent);

/// <summary>
/// O "lado de fora" dos provedores de localização (Nominatim, BrasilAPI, ViaCEP), no lugar da rede. O adaptador real
/// roda inteiro — URL, cabeçalhos, nova tentativa, leitura do JSON — e a resposta vem daqui. Sem resposta
/// configurada, a chamada falha: nenhum teste chega à rede de verdade.
/// </summary>
public sealed class FakeGeoHttp
{
    private readonly ConcurrentQueue<GeoCall> _calls = new();
    private readonly ConcurrentQueue<(string PathFragment, HttpStatusCode Status, string Body)> _scripted = new();
    private Func<Uri, (HttpStatusCode Status, string Body)?> _responder = _ => null;

    public IReadOnlyList<GeoCall> Calls => [.. _calls];

    /// <summary>Resposta para toda chamada cujo caminho contenha <paramref name="pathFragment"/>.</summary>
    public void Respond(string pathFragment, HttpStatusCode status, string body)
    {
        Func<Uri, (HttpStatusCode, string)?> previous = _responder;
        _responder = uri => uri.PathAndQuery.Contains(pathFragment, StringComparison.Ordinal) ? (status, body) : previous(uri);
    }

    /// <summary>Uma resposta só, consumida pela próxima chamada que case — para falha seguida de sucesso.</summary>
    public void RespondOnce(string pathFragment, HttpStatusCode status, string body) =>
        _scripted.Enqueue((pathFragment, status, body));

    /// <summary>
    /// Um handler novo por pedido da fábrica de <c>HttpClient</c>: ela descarta handlers velhos, e o estado fica aqui.
    /// </summary>
    public HttpMessageHandler CreateHandler() => new Handler(this);

    private (HttpStatusCode Status, string Body) Answer(HttpRequestMessage request)
    {
        Uri uri = request.RequestUri!;
        _calls.Enqueue(new GeoCall(uri, request.Headers.UserAgent.ToString()));

        if (_scripted.TryPeek(out var next) && uri.PathAndQuery.Contains(next.PathFragment, StringComparison.Ordinal)
            && _scripted.TryDequeue(out next))
        {
            return (next.Status, next.Body);
        }

        return _responder(uri) ?? throw new HttpRequestException($"Rede externa proibida nos testes: {uri.Host}");
    }

    private sealed class Handler(FakeGeoHttp state) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            (HttpStatusCode status, string body) = state.Answer(request);
            return Task.FromResult(new HttpResponseMessage(status)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json"),
                RequestMessage = request,
            });
        }
    }
}
