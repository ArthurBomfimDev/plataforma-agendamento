using Booking.Application.Contracts.Identity;
using Microsoft.Extensions.Logging;

namespace Booking.Infrastructure.Module.Identity;

/// <param name="LogRawTokens">Só em Development (o <c>Program</c> decide). Fora dele, o token nunca vai para o log.</param>
public sealed record IdentityMailerSettings(bool LogRawTokens);

/// <summary>
/// Substituto até existir provedor de e-mail. O token só aparece em Development, em nível Debug: quem lê o log de
/// outro ambiente poderia confirmar contas e redefinir senhas alheias (pendência S, RNF-06).
/// </summary>
public sealed class LoggingIdentityMailer(ILogger<LoggingIdentityMailer> logger, IdentityMailerSettings settings) : IIdentityMailer
{
    public Task SendEmailConfirmationAsync(string email, string rawToken, CancellationToken ct = default)
    {
        logger.LogInformation("E-mail de confirmação pendente de envio para {Email} (sem provedor configurado)", email);

        if (settings.LogRawTokens)
        {
            logger.LogDebug("Token de confirmação de {Email}: {Token}", email, rawToken);
        }

        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string email, string rawToken, CancellationToken ct = default)
    {
        logger.LogInformation("E-mail de redefinição de senha pendente de envio para {Email} (sem provedor configurado)", email);

        if (settings.LogRawTokens)
        {
            logger.LogDebug("Token de redefinição de {Email}: {Token}", email, rawToken);
        }

        return Task.CompletedTask;
    }
}
