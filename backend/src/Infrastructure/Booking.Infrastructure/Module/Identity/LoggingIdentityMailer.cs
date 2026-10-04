using Booking.Application.Contracts.Identity;
using Microsoft.Extensions.Logging;

namespace Booking.Infrastructure.Module.Identity;

/// <summary>
/// Substituto até existir provedor de e-mail. O token só aparece em nível Debug — nunca em Information.
/// </summary>
public sealed class LoggingIdentityMailer(ILogger<LoggingIdentityMailer> logger) : IIdentityMailer
{
    public Task SendEmailConfirmationAsync(string email, string rawToken, CancellationToken ct = default)
    {
        logger.LogInformation("E-mail de confirmação pendente de envio para {Email} (sem provedor configurado)", email);
        logger.LogDebug("Token de confirmação de {Email}: {Token}", email, rawToken);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string email, string rawToken, CancellationToken ct = default)
    {
        logger.LogInformation("E-mail de redefinição de senha pendente de envio para {Email} (sem provedor configurado)", email);
        logger.LogDebug("Token de redefinição de {Email}: {Token}", email, rawToken);
        return Task.CompletedTask;
    }
}
