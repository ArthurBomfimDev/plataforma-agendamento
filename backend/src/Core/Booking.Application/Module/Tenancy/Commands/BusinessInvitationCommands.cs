using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Tenancy;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Tenancy.Commands;

/// <summary>Regras comuns dos comandos de convite: papel convidável, vagas e leitura da resposta.</summary>
internal static class InvitationRules
{
    public static BusinessMembershipRole ParseInvitableRole(string? role)
    {
        if (!Enum.TryParse(role, ignoreCase: true, out BusinessMembershipRole parsed)
            || parsed is not (BusinessMembershipRole.Professional or BusinessMembershipRole.Attendant))
        {
            throw new DomainException("invitation.role_invalid");
        }

        return parsed;
    }

    /// <summary>Conta + convites pendentes contra o limite do estabelecimento. Convite pendente já reserva a vaga.</summary>
    public static async Task EnsureSeatAvailableAsync(
        Business business,
        IBusinessMembershipRepository memberships,
        IBusinessInvitationRepository invitations,
        DateTimeOffset now,
        CancellationToken ct)
    {
        int used = await memberships.CountSeatsAsync(ct) + await invitations.CountPendingAsync(now, ct);

        if (used >= business.SeatLimit)
        {
            throw new DomainException("business.seat_limit_reached");
        }
    }

    public static InvitationResponse ToResponse(BusinessInvitation invitation, DateTimeOffset now) =>
        new(
            invitation.Id,
            invitation.InviteeName,
            invitation.Email,
            invitation.Role.ToString(),
            invitation.ProfessionalId,
            invitation.StateAt(now).ToString(),
            invitation.ExpiresAt,
            invitation.LastSentAt);
}

/// <summary>
/// O Owner convida por e-mail. Respeita o <c>SeatLimit</c>. É o único caminho para entrar na equipe: o registro de
/// profissional nasce no aceite, e o atendente nunca tem um.
/// </summary>
public sealed class InviteMemberCommand(
    IBusinessRepository businesses,
    IBusinessMembershipRepository memberships,
    IBusinessInvitationRepository invitations,
    IAccountProvisioner accounts,
    IProfessionalLinker professionalLinker,
    IUserDirectory users,
    IInvitationMailer mailer,
    ISecureTokenGenerator tokens,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<InvitationResponse> ExecuteAsync(InviteMemberRequest request, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireOwner();
        Guid ownerId = actor.RequireUserId();
        DateTimeOffset now = clock.GetUtcNow();

        BusinessMembershipRole role = InvitationRules.ParseInvitableRole(request.Role);
        string email = Email.Of(request.Email).Address;

        Business business = await businesses.GetByIdAsync(businessId, ct) ?? throw new DomainException("business.not_found");
        await InvitationRules.EnsureSeatAvailableAsync(business, memberships, invitations, now, ct);

        if (await invitations.ExistsPendingForEmailAsync(email, now, ct))
        {
            throw new DomainException("invitation.already_pending");
        }

        AccountInfo? account = await accounts.FindByEmailAsync(email, ct);

        if (account is not null)
        {
            BusinessMembership? existing = await memberships.GetByBusinessAndUserAsync(businessId, account.UserId, ct);

            if (existing is { Status: BusinessMembershipStatus.Active or BusinessMembershipStatus.Invited })
            {
                throw new DomainException("invitation.already_member");
            }
        }

        if (request.ProfessionalId is Guid professionalId)
        {
            if (role != BusinessMembershipRole.Professional)
            {
                throw new DomainException("invitation.attendant_has_no_professional");
            }

            if (!await professionalLinker.IsLinkableAsync(businessId, professionalId, ct))
            {
                throw new DomainException("invitation.professional_not_linkable");
            }
        }

        GeneratedToken token = tokens.Generate();
        BusinessInvitation invitation = BusinessInvitation.Create(
            businessId, email, request.Name, role, request.ProfessionalId, ownerId, token.Hash, now);
        invitations.Add(invitation);

        await QueueEmailAsync(users, mailer, business.Name, ownerId, invitation, token.Raw, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return InvitationRules.ToResponse(invitation, now);
    }

    internal static async Task QueueEmailAsync(
        IUserDirectory users,
        IInvitationMailer mailer,
        string businessName,
        Guid inviterId,
        BusinessInvitation invitation,
        string rawToken,
        CancellationToken ct)
    {
        IReadOnlyDictionary<Guid, string> names = await users.GetFullNamesAsync([inviterId], ct);
        string inviter = names.TryGetValue(inviterId, out string? name) ? name : businessName;

        await mailer.QueueInvitationAsync(
            invitation.Email, invitation.InviteeName, businessName, inviter, invitation.Role.ToString(), rawToken, BusinessInvitation.LifetimeDays, ct);
    }
}

/// <summary>Reenviar gera um token novo (o link antigo deixa de valer) e um prazo novo. Convite expirado volta a ocupar vaga.</summary>
public sealed class ResendInvitationCommand(
    IBusinessRepository businesses,
    IBusinessMembershipRepository memberships,
    IBusinessInvitationRepository invitations,
    IUserDirectory users,
    IInvitationMailer mailer,
    ISecureTokenGenerator tokens,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<InvitationResponse> ExecuteAsync(Guid invitationId, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireOwner();
        Guid ownerId = actor.RequireUserId();
        DateTimeOffset now = clock.GetUtcNow();

        BusinessInvitation invitation = await invitations.GetByIdAsync(invitationId, ct)
            ?? throw new DomainException("invitation.not_found");

        Business business = await businesses.GetByIdAsync(businessId, ct) ?? throw new DomainException("business.not_found");

        // O expirado não contava como vaga; ao reenviar ele volta a contar.
        if (invitation.StateAt(now) == InvitationState.Expired)
        {
            await InvitationRules.EnsureSeatAvailableAsync(business, memberships, invitations, now, ct);
        }

        GeneratedToken token = tokens.Generate();
        invitation.Resend(token.Hash, now);

        await InviteMemberCommand.QueueEmailAsync(users, mailer, business.Name, ownerId, invitation, token.Raw, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return InvitationRules.ToResponse(invitation, now);
    }
}

public sealed class RevokeInvitationCommand(
    IBusinessInvitationRepository invitations, IActorContext actor, IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task ExecuteAsync(Guid invitationId, CancellationToken ct = default)
    {
        actor.RequireOwner();

        BusinessInvitation invitation = await invitations.GetByIdAsync(invitationId, ct)
            ?? throw new DomainException("invitation.not_found");

        invitation.Revoke(clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(ct);
    }
}

/// <summary>Convites pendentes do estabelecimento do dono, paginados.</summary>
public sealed class ListInvitationsQuery(IBusinessInvitationRepository invitations, IActorContext actor, TimeProvider clock)
{
    public async Task<PagedResult<InvitationResponse>> ExecuteAsync(PageRequest page, CancellationToken ct = default)
    {
        actor.RequireOwner();
        DateTimeOffset now = clock.GetUtcNow();

        PagedResult<BusinessInvitation> result = await invitations.ListPendingAsync(now, page, ct);

        return new PagedResult<InvitationResponse>(
            [.. result.Items.Select(x => InvitationRules.ToResponse(x, now))], result.Page, result.PageSize, result.TotalCount);
    }
}

/// <summary>
/// A seção Equipe: quem tem conta no estabelecimento e com que papel. É diferente de Profissionais, que lista os perfis
/// públicos: o atendente aparece aqui e não lá.
/// </summary>
public sealed class ListTeamMembersQuery(IBusinessMembershipRepository memberships, IUserDirectory users, IActorContext actor)
{
    public async Task<PagedResult<TeamMemberResponse>> ExecuteAsync(PageRequest page, CancellationToken ct = default)
    {
        actor.RequireOwner();

        PagedResult<BusinessMembership> result = await memberships.ListActiveAsync(page, ct);
        IReadOnlyDictionary<Guid, string> names = await users.GetFullNamesAsync([.. result.Items.Select(x => x.UserId)], ct);

        return new PagedResult<TeamMemberResponse>(
            [.. result.Items.Select(x => new TeamMemberResponse(x.Id, names.GetValueOrDefault(x.UserId, "Sem nome"), x.Role.ToString()))],
            result.Page,
            result.PageSize,
            result.TotalCount);
    }
}

public sealed class GetSeatsQuery(
    IBusinessRepository businesses,
    IBusinessMembershipRepository memberships,
    IBusinessInvitationRepository invitations,
    IActorContext actor,
    TimeProvider clock)
{
    public async Task<SeatsResponse> ExecuteAsync(CancellationToken ct = default)
    {
        Guid businessId = actor.RequireOwner();

        Business business = await businesses.GetByIdAsync(businessId, ct) ?? throw new DomainException("business.not_found");
        int used = await memberships.CountSeatsAsync(ct) + await invitations.CountPendingAsync(clock.GetUtcNow(), ct);

        return new SeatsResponse(used, business.SeatLimit);
    }
}

/// <summary>Acha o convite pelo token. Token que não existe vira o mesmo erro de "não encontrado": não revela nada.</summary>
internal static class InvitationLookup
{
    public static async Task<BusinessInvitation> RequireAsync(
        IBusinessInvitationRepository invitations, ISecureTokenGenerator tokens, string? rawToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            throw new DomainException("invitation.not_found");
        }

        return await invitations.GetByTokenHashAsync(tokens.Hash(rawToken), ct)
            ?? throw new DomainException("invitation.not_found");
    }

    /// <summary>Só o convite pendente segue; os outros estados dão o erro específico que a tela mostra.</summary>
    public static void EnsurePending(BusinessInvitation invitation, DateTimeOffset now)
    {
        switch (invitation.StateAt(now))
        {
            case InvitationState.Accepted:
                throw new DomainException("invitation.already_used");
            case InvitationState.Revoked:
                throw new DomainException("invitation.revoked");
            case InvitationState.Expired:
                throw new DomainException("invitation.expired");
        }
    }
}

/// <summary>A tela #/convite: o que mostrar antes de aceitar. Pública (quem abre o link ainda não tem conta).</summary>
public sealed class PreviewInvitationQuery(
    IBusinessInvitationRepository invitations,
    IBusinessRepository businesses,
    IAccountProvisioner accounts,
    IUserDirectory users,
    ISecureTokenGenerator tokens,
    TimeProvider clock)
{
    public async Task<InvitationPreviewResponse> ExecuteAsync(InvitationTokenRequest request, CancellationToken ct = default)
    {
        BusinessInvitation invitation = await InvitationLookup.RequireAsync(invitations, tokens, request.Token, ct);
        InvitationLookup.EnsurePending(invitation, clock.GetUtcNow());

        Business business = await businesses.GetByIdAsync(invitation.BusinessId, ct) ?? throw new DomainException("invitation.not_found");
        IReadOnlyDictionary<Guid, string> names = await users.GetFullNamesAsync([invitation.InvitedByUserId], ct);

        return new InvitationPreviewResponse(
            business.Name,
            names.TryGetValue(invitation.InvitedByUserId, out string? inviter) ? inviter : business.Name,
            invitation.InviteeName,
            invitation.Email,
            invitation.Role.ToString(),
            await accounts.FindByEmailAsync(invitation.Email, ct) is not null,
            BusinessInvitation.ProfessionalTermsVersion,
            TermsRequired: invitation.Role == BusinessMembershipRole.Professional);
    }
}

/// <summary>O que o aceite faz depois de provada a conta: vínculo no papel convidado e, para profissional, o perfil.</summary>
public sealed class InvitationAcceptance(
    IBusinessMembershipRepository memberships,
    IBusinessRepository businesses,
    IProfessionalLinker professionalLinker,
    IPeopleDirectory people,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<AcceptedInvitationResponse> ExecuteAsync(
        BusinessInvitation invitation, Guid userId, bool termsAccepted, CancellationToken ct)
    {
        DateTimeOffset now = clock.GetUtcNow();
        invitation.Accept(userId, termsAccepted, now);

        BusinessMembership? existing = await memberships.GetByBusinessAndUserAsync(invitation.BusinessId, userId, ct);
        BusinessMembership membership;

        if (existing is null)
        {
            membership = BusinessMembership.CreateAccepted(invitation.BusinessId, userId, invitation.Role, now);
            memberships.Add(membership);
        }
        else if (existing.Status == BusinessMembershipStatus.Removed)
        {
            existing.Rejoin(invitation.Role, now);
            membership = existing;
        }
        else
        {
            throw new DomainException("invitation.already_member");
        }

        if (invitation.Role == BusinessMembershipRole.Professional)
        {
            if (invitation.ProfessionalId is Guid professionalId)
            {
                await professionalLinker.LinkAsync(invitation.BusinessId, professionalId, membership.Id, ct);
            }
            else if (await people.FindProfessionalIdByMembershipAsync(invitation.BusinessId, membership.Id, ct) is null)
            {
                professionalLinker.Create(invitation.BusinessId, invitation.InviteeName, membership.Id);
            }
        }

        await unitOfWork.SaveChangesAsync(ct);

        Business business = await businesses.GetByIdAsync(invitation.BusinessId, ct) ?? throw new DomainException("business.not_found");
        return new AcceptedInvitationResponse(invitation.BusinessId, business.Name, invitation.Role.ToString());
    }
}

/// <summary>
/// Aceite por quem já tem conta e está logado. A conta precisa ser a do e-mail do convite: o link repassado a outra
/// pessoa não vale.
/// </summary>
public sealed class AcceptInvitationCommand(
    IBusinessInvitationRepository invitations,
    IAccountProvisioner accounts,
    ISecureTokenGenerator tokens,
    IActorContext actor,
    InvitationAcceptance acceptance,
    TimeProvider clock)
{
    public async Task<AcceptedInvitationResponse> ExecuteAsync(AcceptInvitationRequest request, CancellationToken ct = default)
    {
        Guid userId = actor.RequireUserId();

        BusinessInvitation invitation = await InvitationLookup.RequireAsync(invitations, tokens, request.Token, ct);
        InvitationLookup.EnsurePending(invitation, clock.GetUtcNow());

        AccountInfo? account = await accounts.FindByEmailAsync(invitation.Email, ct);

        if (account is null || account.UserId != userId || !account.IsActive)
        {
            throw new DomainException("invitation.email_mismatch");
        }

        return await acceptance.ExecuteAsync(invitation, userId, request.AcceptTerms, ct);
    }
}

/// <summary>
/// Aceite criando a conta (nome e senha). O e-mail é o do convite e já conta como confirmado: quem abriu o link o
/// recebeu. Se já existe conta com esse e-mail, a pessoa deve entrar e aceitar logada.
/// </summary>
public sealed class AcceptInvitationWithNewAccountCommand(
    IBusinessInvitationRepository invitations,
    IAccountProvisioner accounts,
    ISecureTokenGenerator tokens,
    InvitationAcceptance acceptance,
    TimeProvider clock)
{
    public async Task<AcceptedInvitationResponse> ExecuteAsync(AcceptInvitationNewAccountRequest request, CancellationToken ct = default)
    {
        BusinessInvitation invitation = await InvitationLookup.RequireAsync(invitations, tokens, request.Token, ct);
        InvitationLookup.EnsurePending(invitation, clock.GetUtcNow());

        if (await accounts.FindByEmailAsync(invitation.Email, ct) is not null)
        {
            throw new DomainException("invitation.account_exists");
        }

        Guid userId = await accounts.CreateConfirmedAccountAsync(invitation.Email, request.FullName, request.Password, ct);

        return await acceptance.ExecuteAsync(invitation, userId, request.AcceptTerms, ct);
    }
}
