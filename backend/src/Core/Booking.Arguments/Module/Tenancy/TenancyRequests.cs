namespace Booking.Arguments.Module.Tenancy;

public sealed record RegisterBusinessRequest(string Name, string Document, string Category);

public sealed record UpdateSchedulingPolicyRequest(
    bool AutoConfirm,
    int PendingExpirationHours,
    int MinLeadTimeHours,
    int BookingHorizonDays,
    int CancellationWindowHours,
    string? TimeZone);

public sealed record UpdateAddressRequest(
    string Street,
    string StreetNumber,
    string District,
    string City,
    string State,
    string PostalCode);

/// <summary>Ponto confirmado pelo proprietário no mapa. <c>Precision</c>: Rooftop, Street, Locality ou City.</summary>
public sealed record ConfirmLocationRequest(double Latitude, double Longitude, string Precision, string Source);

/// <summary>
/// Busca. <c>Category</c>: <c>Beleza</c> ou <c>Saude</c>. <c>MaxPriceCents</c>: só quem tem o serviço em destaque até
/// esse preço. <c>SortBy</c>: <c>distance</c> (padrão) ou <c>price</c> (menor preço "a partir de" primeiro).
/// <c>City</c> (Onda 7C): só estabelecimentos dessa cidade, comparada sem acento e sem caixa, entre os candidatos
/// num raio de 50 km do ponto; com ela, <c>RadiusKm</c> é ignorado.
/// </summary>
public sealed record SearchBusinessesRequest(
    double Latitude,
    double Longitude,
    double RadiusKm = 5,
    string? Term = null,
    int Page = 1,
    int PageSize = 20,
    string? Category = null,
    long? MaxPriceCents = null,
    string? SortBy = null,
    string? City = null);

/// <summary>Decisão do Admin sobre um estabelecimento. Na recusa, a nota é obrigatória.</summary>
public sealed record AdminDecisionRequest(string? Note);
