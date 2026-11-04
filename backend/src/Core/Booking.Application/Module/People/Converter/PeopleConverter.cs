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
            p.BusinessMembershipId,
            p.HasAuthorizationDeclaration,
            p.Registration,
            images.For(p.PhotoImageKey));

    // O perfil de todo profissional ativo é público (ADR-031): a base é a declaração do dono ou o aceite do próprio.
    public static PublicProfessionalResponse ToPublic(Professional p, IImageUrls images) =>
        new(p.Id, p.DisplayName, p.Specialty, p.Bio, p.Registration, images.For(p.PhotoImageKey));

    public static CustomerResponse ToResponse(Customer c) => new(c.Id, c.BirthDate, c.SocialName);
}
