using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;

namespace Booking.Application.Module.Identity.Queries;

public sealed class GetCurrentUserQuery(IUserRepository users)
{
    public async Task<UserResponse> ExecuteAsync(Guid userId, CancellationToken ct = default)
    {
        User user = await users.GetByIdAsync(userId, ct)
            ?? throw new DomainException("user.not_found");

        return new UserResponse(user.Id, user.Email.Address, user.FullName, user.EmailConfirmedAt is not null);
    }
}
