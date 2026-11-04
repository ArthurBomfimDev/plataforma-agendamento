using Booking.Arguments.Common;

namespace Booking.Arguments.Module.People;

/// <summary>
/// <c>IsMe</c>: o proprietário também atende — liga o profissional ao vínculo da própria conta.
/// <c>AuthorizationDeclared</c>: o dono declara ter autorização desta pessoa para exibir os dados dela (obrigatório para
/// salvar bio de quem não tem conta). <c>Registration</c>: registro profissional, opcional, para Saúde.
/// </summary>
public sealed record CreateProfessionalRequest(
    string DisplayName, string? Specialty, string? Bio, bool IsMe, bool AuthorizationDeclared = false, string? Registration = null);

public sealed record UpdateProfessionalRequest(
    string DisplayName, string? Specialty, string? Bio, bool IsActive, bool AuthorizationDeclared = false, string? Registration = null);

/// <summary>O profissional com conta edita a própria especialidade, bio e registro. Nome e situação são do dono.</summary>
public sealed record UpdateMyProfessionalProfileRequest(string? Specialty, string? Bio, string? Registration = null);

public sealed record RegisterCustomerRequest(DateOnly BirthDate, string? SocialName);

/// <summary>
/// Visão do painel. <c>AuthorizationDeclared</c>: o dono já declarou a autorização desta pessoa (não precisa marcar de novo).
/// </summary>
public sealed record ProfessionalResponse(
    Guid Id,
    string DisplayName,
    string? Specialty,
    string? Bio,
    bool IsActive,
    Guid? MembershipId,
    bool AuthorizationDeclared,
    string? Registration,
    ImageSetResponse? Photo = null);

/// <summary>Visão pública: o perfil de todo profissional ativo (ADR-031). O registro só existe em Saúde, quando informado.</summary>
public sealed record PublicProfessionalResponse(
    Guid Id, string DisplayName, string? Specialty, string? Bio, string? Registration, ImageSetResponse? Photo = null);

public sealed record CustomerResponse(Guid Id, DateOnly BirthDate, string? SocialName);
