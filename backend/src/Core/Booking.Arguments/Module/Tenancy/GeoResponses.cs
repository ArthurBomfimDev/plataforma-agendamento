namespace Booking.Arguments.Module.Tenancy;

/// <summary>Endereço de um CEP. <c>PostalCode</c> só com dígitos.</summary>
public sealed record PostalCodeResponse(string PostalCode, string? Street, string? District, string City, string State);

/// <summary>
/// Um resultado da busca por endereço ou cidade. <c>Precision</c>: <c>Rooftop</c>, <c>Street</c>, <c>Locality</c> ou
/// <c>City</c>. <c>City</c> e <c>State</c> (sigla da UF) quando o provedor informa: a busca por cidade usa (Onda 7C).
/// </summary>
public sealed record GeoPlaceResponse(
    string Label, double Latitude, double Longitude, string Precision, string? City = null, string? State = null);

/// <summary>Rótulo curto de um ponto, por exemplo "Centro, Garça", com a cidade e a UF quando conhecidas.</summary>
public sealed record ReverseGeocodeResponse(string Label, string? City = null, string? State = null);
