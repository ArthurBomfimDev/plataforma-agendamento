using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;

namespace Booking.Application.Module.Identity.Commands;

/// <summary>"Minha conta" (Onda 7CF): a pessoa troca o próprio nome. O e-mail não muda aqui.</summary>
public sealed class UpdateMyAccountCommand(IUserRepository users, IUnitOfWork unitOfWork)
{
    public async Task<UserResponse> ExecuteAsync(Guid userId, UpdateMyAccountRequest request, CancellationToken ct = default)
    {
        User user = await users.GetByIdAsync(userId, ct) ?? throw new DomainException("auth.unauthenticated");

        user.ChangeFullName(request.FullName);
        await unitOfWork.SaveChangesAsync(ct);

        return new UserResponse(user.Id, user.Email.Address, user.FullName, user.EmailConfirmedAt is not null);
    }
}

/// <summary>
/// Trocar a senha pedindo a atual (Onda 7CF). Encerra todas as sessões, como a redefinição, e abre uma nova para
/// quem trocou: os outros aparelhos perdem o acesso; este, não. Senha atual errada é 400 (não 401: o 401 faria o
/// cliente tentar renovar a sessão), e há limite de tentativas por conta (política "password").
/// </summary>
public sealed class ChangeMyPasswordCommand(
    IUserRepository users,
    IRefreshTokenRepository refreshTokens,
    IPasswordHasher hasher,
    SessionIssuer sessions,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<AuthResponse> ExecuteAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        User user = await users.GetByIdAsync(userId, ct) ?? throw new DomainException("auth.unauthenticated");

        if (user.Status != UserStatus.Active)
        {
            throw new DomainException("auth.account_not_active");
        }

        if (string.IsNullOrEmpty(request.CurrentPassword) || !hasher.Verify(user.PasswordHash, request.CurrentPassword))
        {
            throw new DomainException("user.current_password_invalid");
        }

        PasswordRules.Ensure(request.NewPassword);

        DateTimeOffset now = clock.GetUtcNow();
        user.ChangePassword(hasher.Hash(request.NewPassword));
        await refreshTokens.RevokeAllActiveAsync(user.Id, now, ct);

        AuthResponse session = sessions.Open(user, now);
        await unitOfWork.SaveChangesAsync(ct);

        return session;
    }
}
