using Booking.Application.Common.Media;
using Booking.Application.Contracts.Notifications;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;

namespace Booking.Application.Module.Tenancy.Converter;

public static class BusinessConverter
{
    public static BusinessResponse ToResponse(Business business) =>
        new(
            business.Id,
            business.Name,
            business.Document.Number,
            business.Category.ToString(),
            business.Status.ToString(),
            business.VerificationLevel.ToString());

    /// <summary>
    /// O que o aviso de status ao dono precisa: o nome, se é sensível e o motivo da suspensão ou da reprovação.
    /// Nunca o documento nem o registro no conselho.
    /// </summary>
    public static BusinessStatusFacts ToStatusFacts(Business business) =>
        new(business.Id, business.Name, business.Category.RequiresSensitiveHandling(), StatusReason(business));

    public static AddressResponse ToAddress(Business business) =>
        new(business.Street, business.StreetNumber, business.District, business.City, business.State, business.PostalCode);

    public static BusinessDetailResponse ToDetail(Business business, IImageUrls images) =>
        new(
            business.Id,
            business.Name,
            business.Document.Number,
            business.Category.ToString(),
            business.Status.ToString(),
            business.VerificationLevel.ToString(),
            ToAddress(business),
            business.Location?.Latitude,
            business.Location?.Longitude,
            business.LocationPrecision?.ToString(),
            business.LocationConfirmedAt is not null,
            new SchedulingPolicyResponse(
                business.AutoConfirm,
                business.PendingExpirationHours,
                business.MinLeadTimeHours,
                business.BookingHorizonDays,
                business.CancellationWindowHours,
                business.TimeZone),
            images.For(business.LogoImageKey),
            images.For(business.CoverImageKey),
            StatusReason(business),
            business.TermsAcceptedAt is not null,
            business.HasResponsible,
            business.DocumentType.ToString(),
            business.IsMei,
            Gallery(business, images));

    /// <summary>As fotos da vitrine, na ordem; a primeira é a capa. Chave sem arquivo conhecido não vira item.</summary>
    private static IReadOnlyList<Booking.Arguments.Common.ImageSetResponse> Gallery(Business business, IImageUrls images) =>
        [.. business.GalleryImageKeys.Select(images.For).OfType<Booking.Arguments.Common.ImageSetResponse>()];

    /// <summary>
    /// O motivo que o dono precisa ler: o da suspensão (Suspenso) ou o da reprovação (rascunho com nível Rejected).
    /// Fora desses dois estados, nada.
    /// </summary>
    private static string? StatusReason(Business business) => business.Status switch
    {
        BusinessStatus.Suspended => business.SuspensionReason,
        BusinessStatus.Draft when business.VerificationLevel == VerificationLevel.Rejected => business.VerificationNote,
        _ => null,
    };

    public static AdminBusinessDetailResponse ToAdminDetail(
        Business business, IReadOnlyList<ChecklistItemResponse> checklist, IImageUrls images) =>
        new(
            ToDetail(business, images),
            checklist,
            business.VerifiedByUserId,
            business.VerifiedAt,
            business.VerificationNote,
            business.HasResponsible
                ? new ResponsibleResponse(
                    business.ResponsibleName!,
                    business.ResponsibleCouncil!.Value.ToString(),
                    business.ResponsibleCouncilNumber!,
                    business.ResponsibleCouncilState!)
                : null,
            business.SuspensionReason,
            business.SuspendedByUserId,
            business.SuspendedAt,
            business.TermsAcceptedAt,
            business.TermsVersion);

    public static PublicBusinessResponse ToPublic(Business business, IImageUrls images) =>
        new(
            business.Id,
            business.Name,
            business.Category.ToString(),
            business.VerificationLevel == VerificationLevel.Verified,
            ToAddress(business),
            business.LocationConfirmedAt is null ? null : business.Location?.Latitude,
            business.LocationConfirmedAt is null ? null : business.Location?.Longitude,
            business.CancellationWindowHours,
            business.PendingExpirationHours,
            business.AutoConfirm,
            business.TimeZone,
            images.For(business.LogoImageKey),
            images.For(business.CoverImageKey),
            Gallery(business, images));
}
