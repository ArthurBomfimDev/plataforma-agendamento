using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Identity.Commands;

public sealed class LoginCommand(
    IUserRepository users,
    IPasswordHasher hasher,
    SessionIssuer sessions,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<AuthResponse> ExecuteAsync(LoginRequest request, CancellationToken ct = default)
    {
        Email email;
        try
        {
            email = Email.Of(request.Email);
        }
        catch (DomainException)
        {
            throw new DomainException("auth.invalid_credentials");
        }

        User? user = await users.GetByEmailAsync(email, ct);

        if (user is null)
        {
            hasher.Hash(request.Password ?? string.Empty);
            throw new DomainException("auth.invalid_credentials");
        }

        if (string.IsNullOrEmpty(request.Password) || !hasher.Verify(user.PasswordHash, request.Password))
        {
            throw new DomainException("auth.invalid_credentials");
        }

        if (user.Status != UserStatus.Active)
        {
            throw new DomainException("auth.account_not_active");
        }

        AuthResponse response = sessions.Open(user, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(ct);

        return response;
    }
}
