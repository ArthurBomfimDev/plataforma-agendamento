using System.Net;
using System.Text.Json;
using Booking.Application.Module.Tenancy.Geo;

namespace Booking.Infrastructure.Module.Tenancy.Geo;

/// <summary>BrasilAPI, <c>/api/cep/v1/{cep}</c>: 404 quando o CEP não existe.</summary>
public sealed class BrasilApiPostalCodeLookup(HttpClient http) : IPostalCodeLookup
{
    public async Task<PostalCodeAddress?> LookupAsync(string postalCode, CancellationToken ct = default)
    {
        using HttpResponseMessage response = await GeoHttp.SendAsync(
            http, () => new HttpRequestMessage(HttpMethod.Get, $"api/cep/v1/{postalCode}"), ct);

        if (response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.BadRequest || !response.IsSuccessStatusCode)
        {
            return null;
        }

        using JsonDocument document = JsonDocument.Parse(await response.Content.ReadAsStreamAsync(ct));
        JsonElement root = document.RootElement;

        string? city = PostalCodeJson.Text(root, "city");
        string? state = PostalCodeJson.Text(root, "state");

        return city is null || state is null
            ? null
            : new PostalCodeAddress(postalCode, PostalCodeJson.Text(root, "street"), PostalCodeJson.Text(root, "neighborhood"), city, state);
    }
}

/// <summary>ViaCEP, <c>/ws/{cep}/json/</c>: responde 200 com <c>"erro"</c> quando o CEP não existe.</summary>
public sealed class ViaCepPostalCodeLookup(HttpClient http) : IPostalCodeLookup
{
    public async Task<PostalCodeAddress?> LookupAsync(string postalCode, CancellationToken ct = default)
    {
        using HttpResponseMessage response = await GeoHttp.SendAsync(
            http, () => new HttpRequestMessage(HttpMethod.Get, $"ws/{postalCode}/json/"), ct);

        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        using JsonDocument document = JsonDocument.Parse(await response.Content.ReadAsStreamAsync(ct));
        JsonElement root = document.RootElement;

        if (root.ValueKind != JsonValueKind.Object || root.TryGetProperty("erro", out _))
        {
            return null;
        }

        string? city = PostalCodeJson.Text(root, "localidade");
        string? state = PostalCodeJson.Text(root, "uf");

        return city is null || state is null
            ? null
            : new PostalCodeAddress(postalCode, PostalCodeJson.Text(root, "logradouro"), PostalCodeJson.Text(root, "bairro"), city, state);
    }
}

internal static class PostalCodeJson
{
    /// <summary>Texto não vazio, ou nulo: os dois provedores mandam <c>""</c> ou <c>null</c> para o que não têm.</summary>
    public static string? Text(JsonElement element, string property) =>
        element.ValueKind == JsonValueKind.Object
            && element.TryGetProperty(property, out JsonElement value)
            && value.ValueKind == JsonValueKind.String
            && !string.IsNullOrWhiteSpace(value.GetString())
            ? value.GetString()!.Trim()
            : null;
}
