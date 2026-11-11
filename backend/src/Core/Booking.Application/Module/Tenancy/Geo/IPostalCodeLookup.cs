namespace Booking.Application.Module.Tenancy.Geo;

/// <summary>Endereço de um CEP. Logradouro e bairro faltam nos CEPs gerais de cidade pequena.</summary>
public sealed record PostalCodeAddress(string PostalCode, string? Street, string? District, string City, string State);

/// <summary>Porta de consulta de CEP (BrasilAPI ou ViaCEP, por configuração).</summary>
public interface IPostalCodeLookup
{
    /// <summary>O endereço do CEP de 8 dígitos, ou nulo se ele não existe.</summary>
    Task<PostalCodeAddress?> LookupAsync(string postalCode, CancellationToken ct = default);
}
