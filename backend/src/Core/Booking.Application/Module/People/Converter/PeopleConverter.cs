using Booking.Application.Common.Media;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Module.People;

namespace Booking.Application.Module.People.Converter;

public static class PeopleConverter
{
    public static ProfessionalResponse ToResponse(Professional p, IImageUrls images) =>
        new(
            p.Id,
            p.DisplayName,
            p.Specialty,
            p.Bio,
            p.IsActive,
            p.IsPubliclyVisible,
            p.PublicProfileConsentAt is not null,
            p.BusinessMembershipId,
            images.For(p.PhotoImageKey));

    // Sem consentimento, só o nome sai para o público — e a foto também fica de fora.
    public static PublicProfessionalResponse ToPublic(Professional p, IImageUrls images) =>
        p.IsPubliclyVisible
            ? new(p.Id, p.DisplayName, p.Specialty, p.Bio, images.For(p.PhotoImageKey))
            : new(p.Id, p.DisplayName, null, null, null);

    public static CustomerResponse ToResponse(Customer c) => new(c.Id, c.BirthDate, c.SocialName);
}
