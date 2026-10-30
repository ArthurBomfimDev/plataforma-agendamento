using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Tenancy;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;

namespace Booking.Application.Module.Identity.Queries;

public sealed class GetCurrentUserQuery(IUserRepository users, IPeopleDirectory people, IBusinessDirectory businesses)
{
    /// <summary>Teto do seletor de contexto: ninguém opera dezenas de estabelecimentos pela mesma conta.</summary>
    public const int MaxBusinesses = 20;

    public async Task<CurrentUserResponse> ExecuteAsync(Guid userId, CancellationToken ct = default)
    {
        User user = await users.GetByIdAsync(userId, ct)
            ?? throw new DomainException("user.not_found");

        bool hasCustomerProfile = await people.FindCustomerIdAsync(userId, ct) is not null;
        IReadOnlyList<UserBusinessInfo> memberships = await businesses.ListActiveBusinessesOfUserAsync(userId, MaxBusinesses, ct);

        return new CurrentUserResponse(
            user.Id,
            user.Email.Address,
            user.FullName,
            user.EmailConfirmedAt is not null,
            hasCustomerProfile,
            [.. memberships.Select(m => new UserBusinessResponse(m.BusinessId, m.Name, m.Role))]);
    }
}
