using Booking.Application.Contracts.Identity;
using Booking.Application.Module.Identity.Commands;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Identity.Integration;

public sealed class AccountProvisioner(IUserRepository users, IPasswordHasher hasher, TimeProvider clock) : IAccountProvisioner
{
    public async Task<AccountInfo?> FindByEmailAsync(string email, CancellationToken ct = default)
    {
        User? user = await users.GetByEmailAsync(Email.Of(email), ct);

        return user is null ? null : new AccountInfo(user.Id, user.Email.Address, user.FullName, user.Status == UserStatus.Active);
    }

    public async Task<Guid> CreateConfirmedAccountAsync(string email, string fullName, string password, CancellationToken ct = default)
    {
        Email address = Email.Of(email);
        PasswordRules.Ensure(password);

        if (await users.ExistsByEmailAsync(address, ct))
        {
            throw new DomainException("user.email_already_registered");
        }

        User user = User.Create(address, hasher.Hash(password), fullName);
        user.ConfirmEmail(clock.GetUtcNow());
        users.Add(user);

        return user.Id;
    }
}
