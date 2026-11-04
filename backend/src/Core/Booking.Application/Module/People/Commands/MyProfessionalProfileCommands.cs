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

/// <summary>Acha o perfil de profissional ligado à conta que está agindo. Quem não tem perfil (atendente, dono sem "sou eu") recebe 403.</summary>
internal sealed class OwnProfessionalLoader(IProfessionalRepository professionals, IBusinessDirectory businesses, IActorContext actor)
{
    public async Task<Professional> LoadAsync(CancellationToken ct)
    {
        Guid businessId = actor.RequireBusinessId();

        BusinessMembershipInfo membership = await businesses.FindActiveMembershipAsync(businessId, actor.RequireUserId(), ct)
            ?? throw new DomainException("auth.forbidden");

        return await professionals.GetByMembershipIdAsync(membership.MembershipId, ct)
            ?? throw new DomainException("auth.forbidden");
    }
}

/// <summary>"Meu perfil": o profissional lê o próprio perfil (id, especialidade, bio e foto).</summary>
public sealed class GetMyProfessionalProfileQuery(
    IProfessionalRepository professionals, IBusinessDirectory businesses, IActorContext actor, IImageUrls images)
{
    public async Task<ProfessionalResponse> ExecuteAsync(CancellationToken ct = default) =>
        PeopleConverter.ToResponse(await new OwnProfessionalLoader(professionals, businesses, actor).LoadAsync(ct), images);
}

/// <summary>
/// O profissional com conta edita a <b>própria</b> especialidade e bio (ADR-029). O nome, a situação e as demais
/// pessoas continuam com o dono. A foto usa a rota de foto, que já aceita o próprio profissional.
/// </summary>
public sealed class UpdateMyProfessionalProfileCommand(
    IProfessionalRepository professionals, IBusinessDirectory businesses, IActorContext actor, IUnitOfWork unitOfWork, IImageUrls images)
{
    public async Task<ProfessionalResponse> ExecuteAsync(UpdateMyProfessionalProfileRequest request, CancellationToken ct = default)
    {
        Professional professional = await new OwnProfessionalLoader(professionals, businesses, actor).LoadAsync(ct);

        professional.UpdateProfile(professional.DisplayName, request.Specialty, request.Bio);
        professional.SetRegistration(request.Registration);

        await unitOfWork.SaveChangesAsync(ct);
        return PeopleConverter.ToResponse(professional, images);
    }
}
