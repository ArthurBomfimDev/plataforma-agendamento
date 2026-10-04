using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Identity.Commands;

public sealed class RegisterUserCommand(
    IUserRepository users,
    IUserTokenRepository userTokens,
    IPasswordHasher hasher,
    ISecureTokenGenerator tokens,
    IIdentityMailer mailer,
    IUnitOfWork unitOfWork,
    TimeProvider clock,
    IdentityPolicy policy)
{
    public async Task<UserResponse> ExecuteAsync(RegisterUserRequest request, CancellationToken ct = default)
    {
        Email email = Email.Of(request.Email);
        PasswordRules.Ensure(request.Password);

        if (await users.ExistsByEmailAsync(email, ct))
        {
            throw new DomainException("user.email_already_registered");
        }

        User user = User.Create(email, hasher.Hash(request.Password), request.FullName);
        users.Add(user);

        GeneratedToken confirmation = tokens.Generate();
        userTokens.Add(UserToken.Issue(
            user.Id,
            UserTokenType.EmailConfirmation,
            confirmation.Hash,
            clock.GetUtcNow() + policy.EmailConfirmationLifetime));

        await unitOfWork.SaveChangesAsync(ct);
        await mailer.SendEmailConfirmationAsync(email.Address, confirmation.Raw, ct);

        return new UserResponse(user.Id, email.Address, user.FullName, EmailConfirmed: false);
    }
}
