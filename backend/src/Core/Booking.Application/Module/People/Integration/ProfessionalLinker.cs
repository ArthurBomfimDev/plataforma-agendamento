using Booking.Application.Contracts.People;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.People;

namespace Booking.Application.Module.People.Integration;

public sealed class ProfessionalLinker(IProfessionalRepository professionals) : IProfessionalLinker
{
    public async Task<bool> IsLinkableAsync(Guid businessId, Guid professionalId, CancellationToken ct = default)
    {
        Professional? professional = await professionals.GetByIdOfBusinessAsync(businessId, professionalId, ct);

        return professional is { IsActive: true, BusinessMembershipId: null };
    }

    public async Task LinkAsync(Guid businessId, Guid professionalId, Guid membershipId, CancellationToken ct = default)
    {
        Professional professional = await professionals.GetByIdOfBusinessAsync(businessId, professionalId, ct)
            ?? throw new DomainException("professional.not_found");

        if (professional.BusinessMembershipId is not null)
        {
            throw new DomainException("invitation.professional_already_linked");
        }

        professional.LinkMembership(membershipId);
    }

    // No estabelecimento do token (filtro de tenant): quem sai está no contexto dele.
    public async Task DeactivateByMembershipAsync(Guid membershipId, CancellationToken ct = default)
    {
        Professional? professional = await professionals.GetByMembershipIdAsync(membershipId, ct);
        professional?.Deactivate();
    }

    public void Create(Guid businessId, string displayName, Guid membershipId, string? specialty) =>
        professionals.Add(Professional.Create(businessId, displayName, specialty, bio: null, membershipId));
}
