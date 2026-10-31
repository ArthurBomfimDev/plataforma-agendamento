using System.Net;
using Booking.Application.Contracts.Identity;
using Booking.Application.Module.Identity.Commands;
using Booking.Arguments.Module.Identity;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.ValueObject;
using Booking.Infrastructure.Persistence.Context;
using Booking.IntegrationTests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace Booking.IntegrationTests.Identity;

/// <summary>
/// "Minha conta" (Onda 7CF): trocar o nome e trocar a senha pedindo a atual. A troca de senha encerra as outras
/// sessões e abre uma nova para quem trocou.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class MyAccountTests(IntegrationFixture fixture)
{
    private const string _password = "senha-atual-123";
    private readonly TestWorld _world = new(fixture);

    /// <summary>Conta com senha conhecida e duas sessões abertas, como dois aparelhos.</summary>
    private async Task<(Guid UserId, AuthResponse First, AuthResponse Second)> AccountWithTwoSessionsAsync()
    {
        await using AsyncServiceScope scope = fixture.Factory.Services.CreateAsyncScope();
        IServiceProvider services = scope.ServiceProvider;
        BookingDbContext db = services.GetRequiredService<BookingDbContext>();

        User user = User.Create(
            Email.Of($"conta-{Guid.NewGuid():N}@exemplo.test"), services.GetRequiredService<IPasswordHasher>().Hash(_password), "Ana Antiga");
        user.ConfirmEmail(DateTimeOffset.UtcNow);
        db.Add(user);

        SessionIssuer sessions = services.GetRequiredService<SessionIssuer>();
        AuthResponse first = sessions.Open(user, DateTimeOffset.UtcNow);
        AuthResponse second = sessions.Open(user, DateTimeOffset.UtcNow);
        await db.SaveChangesAsync();

        return (user.Id, first, second);
    }

    [Fact]
    public async Task U1_the_person_changes_the_own_name_and_a_blank_name_is_refused()
    {
        (_, AuthResponse session, _) = await AccountWithTwoSessionsAsync();

        UserResponse saved = await _world.SendOkAsync<UserResponse>(
            HttpMethod.Put, "/api/users/me", new UpdateMyAccountRequest("  Ana Nova  "), session.AccessToken);
        Assert.Equal("Ana Nova", saved.FullName);
        Assert.Equal("Ana Nova", (await _world.SendOkAsync<CurrentUserResponse>(
            HttpMethod.Get, "/api/users/me", null, session.AccessToken)).FullName);

        using HttpResponseMessage blank = await _world.SendAsync(
            HttpMethod.Put, "/api/users/me", new UpdateMyAccountRequest("   "), session.AccessToken);
        Assert.Equal(HttpStatusCode.BadRequest, blank.StatusCode);
        Assert.Equal("user.full_name_required", await TestWorld.ErrorCodeAsync(blank));
    }

    [Fact]
    public async Task U2_changing_the_password_needs_the_current_one_and_ends_the_other_sessions()
    {
        (_, AuthResponse first, AuthResponse second) = await AccountWithTwoSessionsAsync();

        using (HttpResponseMessage wrong = await _world.SendAsync(
            HttpMethod.Post, "/api/users/me/password", new ChangePasswordRequest("errada-000000", "nova-senha-456"), first.AccessToken))
        {
            Assert.Equal(HttpStatusCode.BadRequest, wrong.StatusCode);
            Assert.Equal("user.current_password_invalid", await TestWorld.ErrorCodeAsync(wrong));
        }

        using (HttpResponseMessage weak = await _world.SendAsync(
            HttpMethod.Post, "/api/users/me/password", new ChangePasswordRequest(_password, "curta"), first.AccessToken))
        {
            Assert.Equal(HttpStatusCode.BadRequest, weak.StatusCode);
            Assert.Equal("user.password_invalid_length", await TestWorld.ErrorCodeAsync(weak));
        }

        AuthResponse renewed = await _world.SendOkAsync<AuthResponse>(
            HttpMethod.Post, "/api/users/me/password", new ChangePasswordRequest(_password, "nova-senha-456"), first.AccessToken);

        // A outra sessão (o outro aparelho) e a antiga deste caem; a nova continua.
        foreach (string old in new[] { first.RefreshToken, second.RefreshToken })
        {
            using HttpResponseMessage refused = await _world.SendAsync(
                HttpMethod.Post, "/api/auth/refresh", new RefreshSessionRequest(old), null);
            Assert.Equal(HttpStatusCode.Unauthorized, refused.StatusCode);
        }

        AuthResponse next = await _world.SendOkAsync<AuthResponse>(
            HttpMethod.Post, "/api/auth/refresh", new RefreshSessionRequest(renewed.RefreshToken), null!);
        Assert.NotEqual(renewed.RefreshToken, next.RefreshToken);
    }
}
