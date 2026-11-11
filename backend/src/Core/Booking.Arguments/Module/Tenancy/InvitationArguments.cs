namespace Booking.Arguments.Module.Tenancy;

/// <summary>
/// Convite de equipe. <c>Role</c>: <c>Professional</c> ou <c>Attendant</c>. <c>ProfessionalId</c>: perfil já cadastrado
/// pelo dono a ser ligado à conta (só para <c>Professional</c>); sem ele, o perfil é criado no aceite.
/// </summary>
public sealed record InviteMemberRequest(string Name, string Email, string Role, Guid? ProfessionalId = null);

public sealed record InvitationResponse(
    Guid Id,
    string Name,
    string Email,
    string Role,
    Guid? ProfessionalId,
    string State,
    DateTimeOffset ExpiresAt,
    DateTimeOffset LastSentAt);

/// <summary>Vagas da equipe: ocupadas (contas ativas + convites pendentes) e o limite do estabelecimento.</summary>
public sealed record SeatsResponse(int Used, int Limit);

/// <summary>Um membro da equipe com conta: a seção Equipe do painel. Papel de acesso, não perfil público.</summary>
public sealed record TeamMemberResponse(Guid MembershipId, string Name, string Role);

/// <summary>Corpo das rotas públicas: o token vem no corpo, nunca na URL, para não cair em log de acesso.</summary>
public sealed record InvitationTokenRequest(string Token);

/// <summary>
/// O que a tela do convite mostra antes de aceitar. <c>AccountExists</c> decide entre "Criar conta" e "Entrar".
/// Não devolve nada além disso: sem categoria, sem dado do convidado além do nome que o dono informou.
/// </summary>
public sealed record InvitationPreviewResponse(
    string BusinessName,
    string InviterName,
    string InviteeName,
    string Email,
    string Role,
    bool AccountExists,
    string TermsVersion,
    bool TermsRequired);

/// <summary>Aceite por quem já tem conta e está logado. <c>AcceptTerms</c>: obrigatório para <c>Professional</c>.</summary>
public sealed record AcceptInvitationRequest(string Token, bool AcceptTerms);

/// <summary>Aceite criando a conta. O e-mail vem do convite e já conta como confirmado.</summary>
public sealed record AcceptInvitationNewAccountRequest(string Token, string FullName, string Password, bool AcceptTerms);

/// <summary>Resultado do aceite: o estabelecimento ao qual a pessoa agora pertence, e o papel.</summary>
public sealed record AcceptedInvitationResponse(Guid BusinessId, string BusinessName, string Role);
