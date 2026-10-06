using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;

namespace Booking.Application.Module.Identity.Commands;

public sealed class ResetPasswordCommand(
    IUserTokenRepository userTokens,
    IUserRepository users,
    IRefreshTokenRepository refreshTokens,
    IPasswordHasher hasher,
    ISecureTokenGenerator tokens,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task ExecuteAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        PasswordRules.Ensure(request.NewPassword);

        DateTimeOffset now = clock.GetUtcNow();
        UserToken token = await UserTokenLookup.RequireValidAsync(
            userTokens, tokens, UserTokenType.PasswordReset, request.Token, now, ct);

        User user = await users.GetByIdAsync(token.UserId, ct)
            ?? throw new DomainException("user_token.invalid");

        if (user.Status != UserStatus.Active)
        {
            throw new DomainException("user_token.invalid");
        }

        token.MarkAsUsed(now);
        user.ChangePassword(hasher.Hash(request.NewPassword));

        // Trocar a senha encerra todas as sessões: quem tinha o refresh token antigo perde o acesso.
        await refreshTokens.RevokeAllActiveAsync(user.Id, now, ct);

        await unitOfWork.SaveChangesAsync(ct);
    }
}
