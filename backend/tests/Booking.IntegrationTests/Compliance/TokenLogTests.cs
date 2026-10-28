using System.Net;
using Booking.Arguments.Module.Identity;
using Booking.IntegrationTests.Infrastructure;
using Microsoft.Extensions.Logging;

namespace Booking.IntegrationTests.Compliance;

/// <summary>
/// Pendência S: o token de confirmação e o de redefinição de senha não vão para o log fora de Development. A metade
/// em Development é o par que prova que a captura enxergaria o token se ele fosse escrito.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class TokenLogTests(IntegrationFixture fixture)
{
    private const string _mailerCategory = "Booking.Infrastructure.Module.Identity";

    [Theory]
    [InlineData("Testing", false)]
    [InlineData("Production", false)]
    [InlineData("Development", true)]
    public async Task K1_email_tokens_reach_the_log_only_in_development(string environment, bool tokenExpected)
    {
        var logs = new LogCapture(_mailerCategory);
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

        // A captura funciona nos três ambientes: o aviso de envio pendente aparece sempre.
        Assert.Contains(logs.Entries, e => e.Level == LogLevel.Information && e.Message.Contains("confirmação pendente"));
        Assert.Contains(logs.Entries, e => e.Level == LogLevel.Information && e.Message.Contains("redefinição de senha pendente"));

        bool tokenLogged = logs.Entries.Any(e => e.Message.StartsWith("Token de", StringComparison.Ordinal));
        Assert.Equal(tokenExpected, tokenLogged);
    }
}
