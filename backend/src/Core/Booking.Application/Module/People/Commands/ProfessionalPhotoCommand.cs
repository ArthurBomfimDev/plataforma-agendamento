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

/// <summary>
/// Foto do profissional (ADR-023). Quem pode: o dono do estabelecimento, ou o próprio profissional (pelo vínculo da
/// conta). Profissional de outro estabelecimento não é encontrado (filtro de tenant): 404.
/// </summary>
public sealed class ProfessionalPhotoCommand(
    IProfessionalRepository professionals,
    IBusinessDirectory businesses,
    IActorContext actor,
    ImageStore store,
    IUnitOfWork unitOfWork)
{
    public async Task<ProfessionalResponse> SetAsync(Guid professionalId, Stream upload, CancellationToken ct = default)
    {
        (Professional professional, Guid businessId) = await LoadAllowedAsync(professionalId, ct);

        string key = await store.StoreAsync(upload, $"businesses/{businessId:N}/professionals", ct);
        string? previous = professional.ReplacePhoto(key);

        try
        {
            await unitOfWork.SaveChangesAsync(ct);
        }
        catch
        {
            await store.DeleteAsync(key, CancellationToken.None);
            throw;
        }

        await store.DeleteAsync(previous, ct);
        return PeopleConverter.ToResponse(professional, store);
    }

    public async Task<ProfessionalResponse> RemoveAsync(Guid professionalId, CancellationToken ct = default)
    {
        (Professional professional, _) = await LoadAllowedAsync(professionalId, ct);

        string? previous = professional.ReplacePhoto(null);
        await unitOfWork.SaveChangesAsync(ct);

        await store.DeleteAsync(previous, ct);
        return PeopleConverter.ToResponse(professional, store);
    }

    private async Task<(Professional Professional, Guid BusinessId)> LoadAllowedAsync(Guid professionalId, CancellationToken ct)
    {
        Guid businessId = actor.RequireBusinessId();

        Professional professional = await professionals.GetByIdAsync(professionalId, ct)
            ?? throw new DomainException("professional.not_found");

        if (actor.BusinessRole == "Owner")
        {
            return (professional, businessId);
        }

        BusinessMembershipInfo? membership = await businesses.FindActiveMembershipAsync(businessId, actor.RequireUserId(), ct);

        if (membership is null || professional.BusinessMembershipId != membership.MembershipId)
        {
            throw new DomainException("auth.forbidden");
        }

        return (professional, businessId);
    }
}
