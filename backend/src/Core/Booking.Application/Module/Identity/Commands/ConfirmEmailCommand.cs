using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;

namespace Booking.Application.Module.Identity.Commands;

public sealed class ConfirmEmailCommand(
    IUserTokenRepository userTokens,
    IUserRepository users,
    ISecureTokenGenerator tokens,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task ExecuteAsync(ConfirmEmailRequest request, CancellationToken ct = default)
    {
        DateTimeOffset now = clock.GetUtcNow();
        UserToken token = await UserTokenLookup.RequireValidAsync(
            userTokens, tokens, UserTokenType.EmailConfirmation, request.Token, now, ct);

        User user = await users.GetByIdAsync(token.UserId, ct)
            ?? throw new DomainException("user_token.invalid");

        token.MarkAsUsed(now);
        user.ConfirmEmail(now);

        await unitOfWork.SaveChangesAsync(ct);
    }
}
