using Booking.Domain.Enum.Module.Tenancy;

namespace Booking.Application.Module.Tenancy.Geo;

/// <summary>Um lugar devolvido pelo geocodificador: o rótulo para exibir, o ponto e a precisão do palpite.</summary>
public sealed record GeoPlace(string Label, double Latitude, double Longitude, LocationPrecision Precision);

/// <summary>
/// Porta de geocodificação (ADR-016, decisões de 22/09 §5.3). O domínio não sabe qual provedor está atrás:
/// trocar o Nominatim por um provedor pago é configuração. Sem autocomplete: a política do Nominatim público o
/// proíbe, então a busca só roda quando a pessoa envia o texto.
/// </summary>
public interface IGeocodingProvider
{
    /// <summary>Até <paramref name="limit"/> lugares no Brasil para o texto. Lista vazia quando nada casa.</summary>
    Task<IReadOnlyList<GeoPlace>> GeocodeAsync(string query, int limit, CancellationToken ct = default);

    /// <summary>
    /// Rótulo curto do ponto ("Centro, Garça"), ou nulo quando o provedor não reconhece o lugar. O ponto já chega
    /// arredondado (<see cref="GeoPrivacy"/>).
    /// </summary>
    Task<string?> ReverseAsync(double latitude, double longitude, CancellationToken ct = default);
}
