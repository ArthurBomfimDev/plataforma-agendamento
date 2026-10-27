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

public sealed record SearchBusinessesRequest(
    double Latitude,
    double Longitude,
    double RadiusKm = 5,
    string? Term = null,
    int Page = 1,
    int PageSize = 20);

/// <summary>Decisão do Admin sobre um estabelecimento. Na recusa, a nota é obrigatória.</summary>
public sealed record AdminDecisionRequest(string? Note);
