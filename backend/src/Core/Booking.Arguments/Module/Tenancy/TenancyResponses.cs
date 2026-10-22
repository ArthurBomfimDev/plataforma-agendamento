namespace Booking.Arguments.Module.Tenancy;

public sealed record BusinessResponse(
    Guid Id,
    string Name,
    string Document,
    string Category,
    string Status,
    string VerificationLevel);

public sealed record AddressResponse(
    string? Street,
    string? StreetNumber,
    string? District,
    string? City,
    string? State,
    string? PostalCode);

public sealed record SchedulingPolicyResponse(
    bool AutoConfirm,
    int PendingExpirationHours,
    int MinLeadTimeHours,
    int BookingHorizonDays,
    int CancellationWindowHours,
    string TimeZone);

/// <summary>Visão do proprietário: inclui documento, política e estado de verificação.</summary>
public sealed record BusinessDetailResponse(
    Guid Id,
    string Name,
    string Document,
    string Category,
    string Status,
    string VerificationLevel,
    AddressResponse Address,
    double? Latitude,
    double? Longitude,
    string? LocationPrecision,
    bool LocationConfirmed,
    SchedulingPolicyResponse Policy);

/// <summary>Visão pública da vitrine. Sem documento e sem política interna.</summary>
public sealed record PublicBusinessResponse(
    Guid Id,
    string Name,
    string Category,
    bool Verified,
    AddressResponse Address,
    double? Latitude,
    double? Longitude,
    int CancellationWindowHours);

public sealed record BusinessSearchItemResponse(
    Guid Id,
    string Name,
    string Category,
    bool Verified,
    string? District,
    string? City,
    double DistanceKm);
