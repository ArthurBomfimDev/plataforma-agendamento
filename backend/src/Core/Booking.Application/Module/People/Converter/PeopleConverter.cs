using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Module.People;

namespace Booking.Application.Module.People.Converter;

public static class PeopleConverter
{
    public static ProfessionalResponse ToResponse(Professional p) =>
        new(p.Id, p.DisplayName, p.Specialty, p.Bio, p.IsActive, p.IsPubliclyVisible, p.PublicProfileConsentAt is not null, p.BusinessMembershipId);

    // Sem consentimento, só o nome sai para o público.
    public static PublicProfessionalResponse ToPublic(Professional p) =>
        p.IsPubliclyVisible
            ? new(p.Id, p.DisplayName, p.Specialty, p.Bio)
            : new(p.Id, p.DisplayName, null, null);

    public static CustomerResponse ToResponse(Customer c) => new(c.Id, c.BirthDate, c.SocialName);
}
