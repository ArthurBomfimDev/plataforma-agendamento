using Booking.Arguments.Common;

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
    SchedulingPolicyResponse Policy,
    ImageSetResponse? Logo = null,
    ImageSetResponse? Cover = null);

/// <summary>
/// Visão pública da vitrine. Sem documento. Da política, só o que o consumidor precisa ver antes de pedir:
/// prazo de cancelamento, prazo de confirmação, se confirma sozinho e o fuso dos horários.
/// </summary>
public sealed record PublicBusinessResponse(
    Guid Id,
    string Name,
    string Category,
    bool Verified,
    AddressResponse Address,
    double? Latitude,
    double? Longitude,
    int CancellationWindowHours,
    int PendingExpirationHours,
    bool AutoConfirm,
    string TimeZone,
    ImageSetResponse? Logo = null,
    ImageSetResponse? Cover = null);

/// <summary>
/// Um resultado da busca. O serviço em destaque é o que casa com o termo (ou o mais barato), com o preço "a partir
/// de" entre os profissionais. Nulo só se o estabelecimento não tiver serviço agendável. Horários livres não vêm
/// aqui: a tela consulta a disponibilidade de cada estabelecimento da página.
/// </summary>
public sealed record BusinessSearchItemResponse(
    Guid Id,
    string Name,
    string Category,
    bool Verified,
    string? District,
    string? City,
    double DistanceKm,
    Guid? ServiceId = null,
    string? ServiceName = null,
    int? DurationMinutes = null,
    long? FromPriceCents = null,
    ImageSetResponse? Logo = null,
    ImageSetResponse? Cover = null);

/// <summary>Item da checklist de ativação. <c>RequiredForSubmit</c> diz se a submissão já exige o item hoje.</summary>
public sealed record ChecklistItemResponse(string Key, bool Done, bool RequiredForSubmit);

/// <summary>Detalhe para o Admin: o estabelecimento, a checklist e o registro da última decisão de verificação.</summary>
public sealed record AdminBusinessDetailResponse(
    BusinessDetailResponse Business,
    IReadOnlyList<ChecklistItemResponse> Checklist,
    Guid? VerifiedByUserId,
    DateTimeOffset? VerifiedAt,
    string? VerificationNote);
