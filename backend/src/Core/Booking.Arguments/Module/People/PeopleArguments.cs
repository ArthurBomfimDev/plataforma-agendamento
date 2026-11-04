using Booking.Arguments.Common;

namespace Booking.Arguments.Module.People;

/// <summary><c>IsMe</c>: o proprietário também atende — liga o profissional ao vínculo da própria conta.</summary>
public sealed record CreateProfessionalRequest(string DisplayName, string? Specialty, string? Bio, bool IsMe);

public sealed record UpdateProfessionalRequest(string DisplayName, string? Specialty, string? Bio, bool IsActive, bool ShowFullProfile);

/// <summary>O profissional com conta edita a própria especialidade e bio. Nome e situação são do dono.</summary>
public sealed record UpdateMyProfessionalProfileRequest(string? Specialty, string? Bio);

public sealed record RegisterCustomerRequest(DateOnly BirthDate, string? SocialName);

public sealed record ProfessionalResponse(
    Guid Id,
    string DisplayName,
    string? Specialty,
    string? Bio,
    bool IsActive,
    bool IsPubliclyVisible,
    bool HasPublicProfileConsent,
    Guid? MembershipId,
    ImageSetResponse? Photo = null);

/// <summary>
/// Visão pública: só o nome, salvo consentimento do profissional para o perfil completo. A foto segue a mesma regra
/// (decisões de 22/09 §3): sem perfil completo visível, <c>Photo</c> é nulo.
/// </summary>
public sealed record PublicProfessionalResponse(Guid Id, string DisplayName, string? Specialty, string? Bio, ImageSetResponse? Photo = null);

public sealed record CustomerResponse(Guid Id, DateOnly BirthDate, string? SocialName);
