using Booking.Application.Common.Media;
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
            images.For(business.CoverImageKey));

    public static AdminBusinessDetailResponse ToAdminDetail(
        Business business, IReadOnlyList<ChecklistItemResponse> checklist, IImageUrls images) =>
        new(ToDetail(business, images), checklist, business.VerifiedByUserId, business.VerifiedAt, business.VerificationNote);

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
            images.For(business.CoverImageKey));
}
