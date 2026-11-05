namespace Booking.Arguments.Module.Compliance;

/// <summary><c>Version</c>: a versão do texto que a tela exibiu. Precisa ser a vigente.</summary>
public sealed record GrantConsentRequest(string Purpose, string Version);

public sealed record ConsentResponse(Guid Id, string Purpose, string Version, DateTimeOffset GrantedAt, DateTimeOffset? RevokedAt);

/// <summary>Versão vigente de cada texto de consentimento — a tela usa para saber o que exibir.</summary>
public sealed record ConsentVersionsResponse(string SensitiveScheduling);
