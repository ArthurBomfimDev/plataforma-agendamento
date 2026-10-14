using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.Tenancy;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Identity;

namespace Booking.Application.Module.Identity.Commands;

/// <summary>
/// Troca o contexto ativo: consumidor (sem <c>businessId</c>) ou painel de um estabelecimento em que o usuário
/// tem vínculo ativo (decisões de identidade §2.0). Emite só um novo access token; o refresh token não muda,
/// então depois de renovar a sessão o cliente pede o contexto de novo.
/// </summary>
public sealed class SwitchContextCommand(
    IUserRepository users,
    IBusinessDirectory businesses,
    IAccessTokenIssuer accessTokens,
    TimeProvider clock)
{
    public async Task<ContextTokenResponse> ExecuteAsync(Guid userId, SwitchContextRequest request, CancellationToken ct = default)
    {
        User user = await users.GetByIdAsync(userId, ct) ?? throw new DomainException("auth.unauthenticated");

        if (user.Status != UserStatus.Active)
        {
            throw new DomainException("auth.account_not_active");
        }

        BusinessContext? context = null;

        if (request.BusinessId is Guid businessId)
        {
            BusinessMembershipInfo membership = await businesses.FindActiveMembershipAsync(businessId, userId, ct)
                ?? throw new DomainException("auth.forbidden");

            context = new BusinessContext(membership.BusinessId, membership.Role);
        }

        AccessToken token = accessTokens.Issue(user, clock.GetUtcNow(), context);

        return new ContextTokenResponse(token.Value, token.ExpiresAt, context?.BusinessId, context?.Role);
    }
}
