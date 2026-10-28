namespace Booking.Infrastructure.Module.Tenancy.Geo;

/// <summary>
/// Seção <c>Geo</c> (<c>Geo__…</c> no ambiente). Trocar de provedor é trocar estas variáveis: nada aqui é segredo, e o
/// provedor pago de produção entra como mais um adaptador da mesma porta (ADR-022).
/// </summary>
public sealed class GeoOptions
{
    public const string SectionName = "Geo";

    /// <summary>
    /// Identifica a aplicação para o provedor; a política do Nominatim público exige. Sem e-mail de pessoa por padrão:
    /// o contato, se houver, vai em <see cref="NominatimOptions.Email"/>.
    /// </summary>
    public string UserAgent { get; set; } = "Vagoo/0.1 (projeto academico FATEC Garca)";

    /// <summary>Tempo máximo de cada tentativa. Há uma nova tentativa só, depois de uma falha transitória.</summary>
    public int TimeoutSeconds { get; set; } = 5;

    /// <summary>Validade do cache das respostas (por consulta normalizada).</summary>
    public int CacheHours { get; set; } = 24;

    public NominatimOptions Nominatim { get; set; } = new();

    public PostalCodeOptions PostalCode { get; set; } = new();
}

public sealed class NominatimOptions
{
    public string BaseUrl { get; set; } = "https://nominatim.openstreetmap.org/";

    /// <summary>Intervalo mínimo entre duas chamadas, em toda a instância: o Nominatim público aceita 1 por segundo.</summary>
    public int MinIntervalMilliseconds { get; set; } = 1000;

    /// <summary>Contato opcional enviado ao Nominatim (parâmetro <c>email</c>), como a política recomenda para volume.</summary>
    public string? Email { get; set; }
}

public sealed class PostalCodeOptions
{
    public const string BrasilApi = "BrasilApi";
    public const string ViaCep = "ViaCep";

    /// <summary><c>BrasilApi</c> (padrão) ou <c>ViaCep</c>.</summary>
    public string Provider { get; set; } = BrasilApi;

    /// <summary>Endereço do provedor; vazio usa o público de cada um.</summary>
    public string? BaseUrl { get; set; }

    public string ResolvedBaseUrl => !string.IsNullOrWhiteSpace(BaseUrl)
        ? BaseUrl
        : Provider == ViaCep ? "https://viacep.com.br/" : "https://brasilapi.com.br/";
}
