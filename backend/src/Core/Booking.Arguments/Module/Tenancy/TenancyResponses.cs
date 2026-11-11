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
    ImageSetResponse? Cover = null,
    string? StatusReason = null,
    bool TermsAccepted = false,
    bool ResponsibleInformed = false,
    string? DocumentType = null,
    bool IsMei = false,
    IReadOnlyList<ImageSetResponse>? Photos = null);

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
    ImageSetResponse? Cover = null,
    IReadOnlyList<ImageSetResponse>? Photos = null);

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
    ImageSetResponse? Cover = null,
    double? RatingAverage = null,
    int RatingCount = 0);

/// <summary>Item da checklist de ativação. <c>RequiredForSubmit</c> diz se a submissão já exige o item hoje.</summary>
public sealed record ChecklistItemResponse(string Key, bool Done, bool RequiredForSubmit);

/// <summary>Um item da verificação. O servidor manda chave, estado e o detalhe que varia com os dados; título e explicação são do frontend.</summary>
public sealed record VerificationItemResponse(string Key, bool Done, string? Detail);

/// <summary>
/// A faixa de verificação do painel do dono. <c>Status</c> é o do ciclo de vida (<c>Draft</c>, <c>PendingReview</c>,
/// <c>Active</c>, <c>Suspended</c>); <c>Rejected</c> marca o rascunho devolvido pelo Admin. Só os itens exigidos no envio.
/// </summary>
public sealed record VerificationResponse(
    string Status,
    bool Rejected,
    bool AppearsInSearch,
    DateTimeOffset? SubmittedAt,
    DateTimeOffset? DecidedAt,
    string? DecisionReason,
    bool CanSubmit,
    string SubmitAction,
    int CompletedCount,
    int TotalCount,
    IReadOnlyList<VerificationItemResponse> Items);

/// <summary>Detalhe para o Admin: o estabelecimento, a checklist e o registro da última decisão de verificação.</summary>
public sealed record AdminBusinessDetailResponse(
    BusinessDetailResponse Business,
    IReadOnlyList<ChecklistItemResponse> Checklist,
    Guid? VerifiedByUserId,
    DateTimeOffset? VerifiedAt,
    string? VerificationNote,
    ResponsibleResponse? Responsible = null,
    string? SuspensionReason = null,
    Guid? SuspendedByUserId = null,
    DateTimeOffset? SuspendedAt = null,
    DateTimeOffset? TermsAcceptedAt = null,
    string? TermsVersion = null);

/// <summary>Uma denúncia na fila do Admin. Sem IP nem dado do aparelho; <c>ReporterUserId</c> só se a pessoa estava logada.</summary>
public sealed record BusinessReportResponse(
    Guid Id,
    Guid BusinessId,
    string BusinessName,
    string Reason,
    string Status,
    DateTimeOffset ReportedAt,
    Guid? ReporterUserId,
    Guid? ResolvedByUserId,
    DateTimeOffset? ResolvedAt,
    string? Resolution);

/// <summary>Responsável de Saúde e registro no conselho. Só o Admin recebe; nunca é público nem vai para log.</summary>
public sealed record ResponsibleResponse(string Name, string Council, string CouncilNumber, string CouncilState);
