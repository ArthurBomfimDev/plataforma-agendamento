namespace Booking.Arguments.Module.Identity;

public sealed record RegisterUserRequest(string Email, string Password, string FullName);

public sealed record LoginRequest(string Email, string Password);

public sealed record RefreshSessionRequest(string RefreshToken);

public sealed record LogoutRequest(string RefreshToken);

public sealed record ConfirmEmailRequest(string Token);

public sealed record ForgotPasswordRequest(string Email);

public sealed record ResetPasswordRequest(string Token, string NewPassword);
