namespace Booking.Arguments.Module.Identity;

public sealed record RegisterUserRequest(string Email, string Password, string FullName);

public sealed record LoginRequest(string Email, string Password);

public sealed record RefreshSessionRequest(string RefreshToken);

public sealed record LogoutRequest(string RefreshToken);

public sealed record ConfirmEmailRequest(string Token);

public sealed record ForgotPasswordRequest(string Email);

public sealed record ResendConfirmationRequest(string Email);

public sealed record ResetPasswordRequest(string Token, string NewPassword);

/// <summary>Estabelecimento a ativar; nulo volta ao contexto de consumidor.</summary>
public sealed record SwitchContextRequest(Guid? BusinessId);

/// <summary>"Minha conta" (Onda 7CF): só o nome. Trocar o e-mail ficou de fora.</summary>
public sealed record UpdateMyAccountRequest(string FullName);

/// <summary>Trocar a senha pedindo a atual. A resposta é uma sessão nova; as outras são encerradas.</summary>
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
