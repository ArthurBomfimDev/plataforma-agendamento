using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Identity.Commands;

public sealed class ResendConfirmationCommand(
    IUserRepository users,
    IUserTokenRepository userTokens,
    ISecureTokenGenerator tokens,
    IIdentityMailer mailer,
    IUnitOfWork unitOfWork,
    TimeProvider clock,
    IdentityPolicy policy)
{
    /// <summary>
    /// Resposta idêntica em todos os casos (conta inexistente, já confirmada, pedido cedo demais): a rota não pode
    /// servir para enumerar contas. O intervalo mínimo conta a partir do último token emitido, então vale também
    /// entre instâncias da API.
    /// </summary>
    public async Task ExecuteAsync(ResendConfirmationRequest request, CancellationToken ct = default)
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

        if (user is null || user.Status != UserStatus.Active || user.EmailConfirmedAt is not null)
        {
            return;
        }

        DateTimeOffset now = clock.GetUtcNow();
        DateTimeOffset? lastIssued = await userTokens.LatestIssuedAtAsync(user.Id, UserTokenType.EmailConfirmation, ct);

        if (lastIssued is not null && now - lastIssued.Value < policy.ConfirmationResendInterval)
        {
            return;
        }

        // Só o último link vale.
        await userTokens.InvalidatePendingAsync(user.Id, UserTokenType.EmailConfirmation, now, ct);

        GeneratedToken confirmation = tokens.Generate();
        userTokens.Add(UserToken.Issue(
            user.Id, UserTokenType.EmailConfirmation, confirmation.Hash, now + policy.EmailConfirmationLifetime));

        // Na mesma transação do token (outbox, ADR-021).
        await mailer.QueueEmailConfirmationAsync(email.Address, user.FullName, confirmation.Raw, ct);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
