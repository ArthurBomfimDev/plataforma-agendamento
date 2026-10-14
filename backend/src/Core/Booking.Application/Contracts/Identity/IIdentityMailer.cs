namespace Booking.Application.Contracts.Identity;

public interface IIdentityMailer
{
    Task SendEmailConfirmationAsync(string email, string rawToken, CancellationToken ct = default);
    Task SendPasswordResetAsync(string email, string rawToken, CancellationToken ct = default);
}
