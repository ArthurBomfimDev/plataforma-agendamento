namespace Booking.Arguments.Module.Tenancy;

/// <summary>Endereço de um CEP. <c>PostalCode</c> só com dígitos.</summary>
public sealed record PostalCodeResponse(string PostalCode, string? Street, string? District, string City, string State);

/// <summary>Um resultado da busca por endereço ou cidade. <c>Precision</c>: <c>Rooftop</c>, <c>Street</c>, <c>Locality</c> ou <c>City</c>.</summary>
public sealed record GeoPlaceResponse(string Label, double Latitude, double Longitude, string Precision);

/// <summary>Rótulo curto de um ponto, por exemplo "Centro, Garça".</summary>
public sealed record ReverseGeocodeResponse(string Label);
