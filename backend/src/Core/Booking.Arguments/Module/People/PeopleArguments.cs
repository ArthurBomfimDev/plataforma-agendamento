namespace Booking.Arguments.Module.People;

/// <summary><c>IsMe</c>: o proprietário também atende — liga o profissional ao vínculo da própria conta.</summary>
public sealed record CreateProfessionalRequest(string DisplayName, string? Specialty, string? Bio, bool IsMe);

public sealed record UpdateProfessionalRequest(string DisplayName, string? Specialty, string? Bio, bool IsActive, bool ShowFullProfile);

public sealed record RegisterCustomerRequest(DateOnly BirthDate, string? SocialName);

public sealed record ProfessionalResponse(
    Guid Id,
    string DisplayName,
    string? Specialty,
    string? Bio,
    bool IsActive,
    bool IsPubliclyVisible,
    bool HasPublicProfileConsent,
    Guid? MembershipId);

/// <summary>Visão pública: só o nome, salvo consentimento do profissional para o perfil completo.</summary>
public sealed record PublicProfessionalResponse(Guid Id, string DisplayName, string? Specialty, string? Bio);

public sealed record CustomerResponse(Guid Id, DateOnly BirthDate, string? SocialName);
