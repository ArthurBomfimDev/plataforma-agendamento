using System.Net;
using System.Text.RegularExpressions;
using Booking.Application.Module.Notifications.Commands;
using Booking.Arguments.Module.Identity;
using Booking.IntegrationTests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace Booking.IntegrationTests.Compliance;

/// <summary>
/// Pendência S, depois da Onda 5B: o token de confirmação e o de redefinição de senha só existem no link do e-mail.
/// Em nenhum ambiente, em nenhuma categoria de log, com Debug aberto de propósito, o token bruto aparece.
/// </summary>
/// <remarks>
/// O par que prova o teste: o token é tirado do próprio e-mail capturado — ele existe, e a captura de log o veria se
/// estivesse lá.
/// </remarks>
[Collection(IntegrationCollection.Name)]
public sealed partial class TokenLogTests(IntegrationFixture fixture)
{
    [Theory]
    [InlineData("Testing")]
    [InlineData("Production")]
    [InlineData("Development")]
    public async Task K1_email_tokens_never_reach_the_log(string environment)
    {
        var logs = new LogCapture(categoryPrefix: string.Empty);
        await using var factory = new BookingApiFactory(fixture.ConnectionString, environment, logs);
        using HttpClient client = factory.CreateClient();
        string email = $"it-log-{Guid.NewGuid():N}@exemplo.test";

        using (HttpResponseMessage registered = await client.SendAsync(TestWorld.Build(
            HttpMethod.Post, "/api/auth/register", new RegisterUserRequest(email, "senha-de-teste-123", "Conta de Log"), null)))
        {
            Assert.Equal(HttpStatusCode.Created, registered.StatusCode);
        }

        using (HttpResponseMessage forgot = await client.SendAsync(TestWorld.Build(
            HttpMethod.Post, "/api/auth/forgot-password", new ForgotPasswordRequest(email), null)))
        {
            Assert.True(forgot.IsSuccessStatusCode);
        }

        await using (AsyncServiceScope scope = factory.Services.CreateAsyncScope())
        {
            await scope.ServiceProvider.GetRequiredService<DispatchOutboxCommand>().ExecuteAsync();
        }

        string[] tokens = [.. factory.Emails.To(email).Select(m => TokenIn(m.TextBody))];
        Assert.Equal(2, tokens.Length);
        Assert.All(tokens, token => Assert.True(token.Length >= 20));

        Assert.NotEmpty(logs.Entries);
        foreach (string token in tokens)
        {
            Assert.DoesNotContain(logs.Entries, e => e.Message.Contains(token, StringComparison.Ordinal));
        }
    }

    private static string TokenIn(string body) => Uri.UnescapeDataString(TokenPattern().Match(body).Groups[1].Value);

    [GeneratedRegex(@"token=([^\s&]+)")]
    private static partial Regex TokenPattern();
}
