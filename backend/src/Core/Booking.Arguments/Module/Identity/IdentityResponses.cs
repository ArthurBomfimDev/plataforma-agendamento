namespace Booking.Arguments.Module.Identity;

public sealed record AuthResponse(string AccessToken, DateTimeOffset AccessTokenExpiresAt, string RefreshToken);

public sealed record UserResponse(Guid Id, string Email, string FullName, bool EmailConfirmed);
