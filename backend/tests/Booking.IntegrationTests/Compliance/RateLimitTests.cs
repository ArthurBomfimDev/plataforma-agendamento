using System.Net;
using Booking.Arguments.Module.Tenancy;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Compliance;

/// <summary>
/// Limite "por conta" é por conta de verdade. O limitador rodava antes da autenticação: <c>context.User</c> ainda era
/// anônimo, e toda política por conta caía no IP. Cada teste sobe a própria API, para o contador nascer zerado; os tokens
/// valem nela porque a chave de assinatura é a da API compartilhada.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class RateLimitTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private static async Task<HttpStatusCode> CreateBusinessAsync(HttpClient client, string token, string name)
    {
        using HttpRequestMessage request = TestWorld.Build(
            HttpMethod.Post, "/api/businesses", new RegisterBusinessRequest(name, Cnpj.Random(), "Beleza"), token);
        using HttpResponseMessage response = await client.SendAsync(request);
        return response.StatusCode;
    }

    [Fact]
    public async Task L1_business_creation_limit_is_per_account_not_per_ip()
    {
        await using BookingApiFactory api = fixture.NewApi();
        using HttpClient client = api.CreateClient();
        TestUser first = await _world.NewUserAsync("Dono que abusa");
        TestUser second = await _world.NewUserAsync("Dono do mesmo IP");

        // 5 tentativas por hora por conta. As 3 primeiras criam; a 4ª e a 5ª param no limite de 3 estabelecimentos por conta.
        var attempts = new List<HttpStatusCode>();
        for (int i = 1; i <= 5; i++)
        {
            attempts.Add(await CreateBusinessAsync(client, first.Token, $"Limite A{i}"));
        }

        Assert.All(attempts.Take(3), status => Assert.Equal(HttpStatusCode.Created, status));
        Assert.All(attempts.Skip(3), status => Assert.Equal(HttpStatusCode.Conflict, status));

        Assert.Equal(HttpStatusCode.TooManyRequests, await CreateBusinessAsync(client, first.Token, "Limite A6"));

        // Mesmo IP, outra conta: o contador é dela.
        Assert.Equal(HttpStatusCode.Created, await CreateBusinessAsync(client, second.Token, "Limite B1"));
    }

    [Fact]
    public async Task L2_ip_policies_stay_per_ip_even_with_different_accounts()
    {
        await using BookingApiFactory api = fixture.NewApi();
        using HttpClient client = api.CreateClient();
        TestUser first = await _world.NewUserAsync("Conta um");
        TestUser second = await _world.NewUserAsync("Conta dois");

        async Task<HttpStatusCode> LookupAsync(string token)
        {
            using HttpRequestMessage request = TestWorld.Build(HttpMethod.Get, "/api/geo/postal-code/123", null, token);
            using HttpResponseMessage response = await client.SendAsync(request);
            return response.StatusCode;
        }

        // A política "geo" é 30 por minuto por IP: trocar de conta não abre outro contador.
        for (int i = 0; i < 30; i++)
        {
            Assert.NotEqual(HttpStatusCode.TooManyRequests, await LookupAsync(i % 2 == 0 ? first.Token : second.Token));
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, await LookupAsync(second.Token));
    }
}
