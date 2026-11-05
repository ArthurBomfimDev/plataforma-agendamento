namespace Booking.Arguments.Module.Reputation;

/// <summary>
/// Avaliar (ou editar) um agendamento concluído. <c>Rating</c>: 1 a 5, do atendimento. <c>ProfessionalRating</c>: 1 a 5,
/// opcional. <c>Comment</c>: opcional, até 500 caracteres, <b>público</b>: não escreva dado de saúde.
/// </summary>
public sealed record SaveReviewRequest(int Rating, int? ProfessionalRating, string? Comment);

/// <summary>
/// Avaliação como o público a vê: só primeiro nome e inicial do sobrenome, e <c>ServiceName</c> nulo em Saúde.
/// </summary>
public sealed record PublicReviewResponse(
    Guid Id,
    int Rating,
    int? ProfessionalRating,
    string? Comment,
    string ReviewerName,
    string? ServiceName,
    DateTimeOffset ReviewedAt);

/// <summary>A avaliação que o consumidor fez. <c>CanEdit</c>: ainda não editou e está dentro dos 7 dias.</summary>
public sealed record MyReviewResponse(
    Guid Id,
    Guid AppointmentId,
    Guid BusinessId,
    Guid ProfessionalId,
    int Rating,
    int? ProfessionalRating,
    string? Comment,
    string? ServiceName,
    DateTimeOffset ReviewedAt,
    DateTimeOffset? EditedAt,
    bool CanEdit);

/// <summary>O dono denuncia: motivo de 5 a 500 caracteres.</summary>
public sealed record ReportReviewRequest(string Reason);

/// <summary>O Admin oculta: motivo obrigatório.</summary>
public sealed record HideReviewRequest(string? Reason);

/// <summary>A avaliação como o dono a vê no painel. <c>Reported</c>: ele já denunciou (uma vez só).</summary>
public sealed record OwnerReviewResponse(
    Guid Id,
    int Rating,
    int? ProfessionalRating,
    string? Comment,
    string ReviewerName,
    string? ServiceName,
    DateTimeOffset ReviewedAt,
    bool Reported);

/// <summary>Item da fila do Admin. <c>ReportOpen</c>: a denúncia ainda espera decisão.</summary>
public sealed record ModerationReviewResponse(
    Guid Id,
    Guid BusinessId,
    string BusinessName,
    int Rating,
    int? ProfessionalRating,
    string? Comment,
    string ReviewerName,
    DateTimeOffset ReviewedAt,
    string? ReportReason,
    DateTimeOffset? ReportedAt,
    bool ReportOpen,
    bool IsHidden,
    string? HiddenReason,
    DateTimeOffset? HiddenAt,
    Guid? HiddenByUserId);

/// <summary>
/// Resumo das notas. <c>Average</c> só vem a partir de 3 avaliações (<c>IsNew</c> é verdadeiro antes disso: a tela mostra
/// "Novo"). <c>Distribution</c>: quantas notas de 1, 2, 3, 4 e 5 estrelas.
/// </summary>
public sealed record RatingSummaryResponse(double? Average, int Count, IReadOnlyList<int> Distribution, bool IsNew);
