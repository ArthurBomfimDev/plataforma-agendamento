namespace Booking.Arguments.Module.Compliance;

/// <summary><c>Version</c>: a versão do texto que a tela exibiu. Precisa ser a vigente.</summary>
public sealed record GrantConsentRequest(string Purpose, string Version);

public sealed record ConsentResponse(Guid Id, string Purpose, string Version, DateTimeOffset GrantedAt, DateTimeOffset? RevokedAt);

/// <summary>Versão vigente de cada consentimento e o texto dela: o que a pessoa lê é o que a versão registra.</summary>
public sealed record ConsentVersionsResponse(string SensitiveScheduling, string SensitiveSchedulingText);
