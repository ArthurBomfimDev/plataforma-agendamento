using Booking.Application.Common.Media;
using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.People.Converter;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.People;

namespace Booking.Application.Module.People.Commands;

public sealed class CreateProfessionalCommand(
    IProfessionalRepository professionals,
    IBusinessDirectory businesses,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    IImageUrls images)
{
    public async Task<ProfessionalResponse> ExecuteAsync(CreateProfessionalRequest request, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireOwner();
        Guid? membershipId = null;

        // O vínculo nunca vem do cliente: só o da própria conta, conferido aqui.
        if (request.IsMe)
        {
            BusinessMembershipInfo membership = await businesses.FindActiveMembershipAsync(businessId, actor.RequireUserId(), ct)
                ?? throw new DomainException("auth.forbidden");
            membershipId = membership.MembershipId;
        }

        Professional professional = Professional.Create(businessId, request.DisplayName, request.Specialty, request.Bio, membershipId);
        professionals.Add(professional);

        await unitOfWork.SaveChangesAsync(ct);
        return PeopleConverter.ToResponse(professional, images);
    }
}

public sealed class UpdateProfessionalCommand(
    IProfessionalRepository professionals, IActorContext actor, IUnitOfWork unitOfWork, IImageUrls images)
{
    public async Task<ProfessionalResponse> ExecuteAsync(Guid professionalId, UpdateProfessionalRequest request, CancellationToken ct = default)
    {
        actor.RequireOwner();

        Professional professional = await professionals.GetByIdAsync(professionalId, ct)
            ?? throw new DomainException("professional.not_found");

        professional.UpdateProfile(request.DisplayName, request.Specialty, request.Bio);

        if (request.IsActive)
        {
            professional.Activate();
        }
        else
        {
            professional.Deactivate();
        }

        if (request.ShowFullProfile)
        {
            professional.ShowFullProfile();
        }
        else
        {
            professional.HideFullProfile();
        }

        await unitOfWork.SaveChangesAsync(ct);
        return PeopleConverter.ToResponse(professional, images);
    }
}

/// <summary>
/// Consentimento para o perfil público completo. Só o próprio profissional dá ou revoga — nunca o dono.
/// </summary>
public sealed class SetPublicProfileConsentCommand(
    IProfessionalRepository professionals,
    IBusinessDirectory businesses,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock,
    IImageUrls images)
{
    public async Task<ProfessionalResponse> ExecuteAsync(Guid professionalId, bool granted, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireBusinessId();
        Guid userId = actor.RequireUserId();

        Professional professional = await professionals.GetByIdAsync(professionalId, ct)
            ?? throw new DomainException("professional.not_found");

        BusinessMembershipInfo? membership = await businesses.FindActiveMembershipAsync(businessId, userId, ct);

        if (membership is null || professional.BusinessMembershipId != membership.MembershipId)
        {
            throw new DomainException("auth.forbidden");
        }

        if (granted)
        {
            professional.GrantPublicProfileConsent(clock.GetUtcNow());
        }
        else
        {
            professional.RevokePublicProfileConsent();
        }

        await unitOfWork.SaveChangesAsync(ct);
        return PeopleConverter.ToResponse(professional, images);
    }
}

public sealed class RegisterCustomerCommand(ICustomerRepository customers, IActorContext actor, IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task<CustomerResponse> ExecuteAsync(RegisterCustomerRequest request, CancellationToken ct = default)
    {
        Guid userId = actor.RequireUserId();

        if (await customers.GetByUserIdAsync(userId, ct) is not null)
        {
            throw new DomainException("customer.already_registered");
        }

        Customer customer = Customer.Create(userId, request.BirthDate, request.SocialName, DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime));
        customers.Add(customer);

        await unitOfWork.SaveChangesAsync(ct);
        return PeopleConverter.ToResponse(customer);
    }
}
