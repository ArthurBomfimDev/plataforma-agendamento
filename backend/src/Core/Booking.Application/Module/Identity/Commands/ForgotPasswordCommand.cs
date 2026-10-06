using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Identity.Commands;

public sealed class ForgotPasswordCommand(
    IUserRepository users,
    IUserTokenRepository userTokens,
    ISecureTokenGenerator tokens,
    IIdentityMailer mailer,
    IUnitOfWork unitOfWork,
    TimeProvider clock,
    IdentityPolicy policy)
{
<<<<<<< HEAD
=======
    /// <summary>Resposta idêntica exista o e-mail ou não: a rota não pode servir para enumerar contas.</summary>
>>>>>>> 072927b623995e9cdf1f2a39df62404aca1719cf
    public async Task ExecuteAsync(ForgotPasswordRequest request, CancellationToken ct = default)
    {
        Email email;
        try
        {
            email = Email.Of(request.Email);
        }
        catch (DomainException)
        {
            return;
        }

        User? user = await users.GetByEmailAsync(email, ct);

        if (user is null || user.Status != UserStatus.Active)
        {
            return;
        }

        DateTimeOffset now = clock.GetUtcNow();
        await userTokens.InvalidatePendingAsync(user.Id, UserTokenType.PasswordReset, now, ct);

        GeneratedToken reset = tokens.Generate();
        userTokens.Add(UserToken.Issue(user.Id, UserTokenType.PasswordReset, reset.Hash, now + policy.PasswordResetLifetime));

        await unitOfWork.SaveChangesAsync(ct);
        await mailer.SendPasswordResetAsync(email.Address, reset.Raw, ct);
    }
}
