using System.Net;
using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Compliance;
using Booking.Arguments.Module.Identity;
using Booking.Arguments.Module.Scheduling;
using Booking.Domain.Entity.Module.Identity;
using Booking.Infrastructure.Module.Identity.Security;
using Booking.Infrastructure.Persistence.Context;
using Booking.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Xunit.Abstractions;

namespace Booking.IntegrationTests.Compliance;

/// <summary>
/// RNF-06: o que a API devolve para quem não deveria ver nada — página pública de um estabelecimento de saúde,
/// e o corpo de um erro inesperado — e os cabeçalhos de segurança.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class SecurityTests(IntegrationFixture fixture, ITestOutputHelper output)
{
    private readonly TestWorld _world = new(fixture);

    /// <summary>
    /// LGPD, Art. 11: em categoria de saúde o próprio agendamento é dado sensível. Nenhuma rota pública do
    /// estabelecimento (vitrine, serviços, profissionais, horários, calendário, busca) traz dado dele.
    /// </summary>
    [Fact]
    public async Task I1_no_public_route_exposes_a_sensitive_appointment()
    {
        TestLocation here = TestLocation.Isolated();
        TestBusiness clinic = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], category: "Saude", location: here);
        TestUser customer = await _world.NewCustomerAsync();
        ConsentVersionsResponse versions = await _world.SendOkAsync<ConsentVersionsResponse>(HttpMethod.Get, "/api/consents/versions", null, customer.Token);
        await _world.SendOkAsync(HttpMethod.Post, "/api/consents", new GrantConsentRequest("SensitiveScheduling", versions.SensitiveScheduling), customer.Token);
        AppointmentResponse appointment = await _world.BookAsync(customer, clinic, clinic.Services[0], clinic.ProfessionalIds[0], TestCalendar.At(10));

        string day = TestCalendar.BookableDay.ToString("yyyy-MM-dd");
        string[] publicRoutes =
        [
            $"/api/businesses/{clinic.Id}",
            $"/api/businesses/{clinic.Id}/services",
            $"/api/businesses/{clinic.Id}/professionals",
            $"/api/businesses/{clinic.Id}/availability?serviceId={clinic.Services[0].Id}&professionalId={clinic.ProfessionalIds[0]}&date={day}",
            $"/api/businesses/{clinic.Id}/availability/calendar?serviceId={clinic.Services[0].Id}&professionalId={clinic.ProfessionalIds[0]}&from={day}&to={day}",
            FormattableString.Invariant($"/api/businesses/search?latitude={here.Latitude}&longitude={here.Longitude}&radiusKm=1"),
        ];

        string[] mustNotAppear =
        [
            appointment.Id.ToString(), customer.CustomerId!.Value.ToString(), customer.UserId.ToString(),
            // O estado como valor JSON, com aspas: "pendingExpirationHours" da política pública não é dado de agendamento.
            "Consumidor de teste", "\"Pending\"", "customerId", "appointmentId",
        ];

        foreach (string route in publicRoutes)
        {
            using HttpResponseMessage response = await _world.SendAsync(HttpMethod.Get, route, null, null);
            string body = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.All(mustNotAppear, secret => Assert.DoesNotContain(secret, body, StringComparison.OrdinalIgnoreCase));
        }

        output.WriteLine($"I1: {publicRoutes.Length} rotas públicas conferidas, nenhuma com dado do agendamento sensível");
    }

    /// <summary>
    /// Erro inesperado (500) não vaza detalhe interno — nem stack, nem SQL, nem a mensagem do banco —, inclusive
    /// em Development, que é como o docker compose sobe a API.
    /// </summary>
    [Theory]
    [InlineData("Testing")]
    [InlineData("Development")]
    public async Task I2_unexpected_error_body_has_no_internal_detail(string environment)
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        string trigger = $"it_leak_{Guid.NewGuid():N}";
        const string secret = "detalhe-interno-que-nao-pode-vazar";

        await ExecuteAsync($"""
            CREATE FUNCTION scheduling.{trigger}() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
              IF NEW.business_id = '{business.Id}' THEN RAISE EXCEPTION '{secret}'; END IF;
              RETURN NEW;
            END $$;
            CREATE TRIGGER {trigger} BEFORE INSERT ON scheduling.appointment
              FOR EACH ROW EXECUTE FUNCTION scheduling.{trigger}();
            """);

        await using var factory = new BookingApiFactory(fixture.ConnectionString, environment);
        try
        {
            using HttpClient client = factory.CreateClient();
            string token = await OwnerTokenAsync(factory, business);

            using HttpResponseMessage response = await client.SendAsync(TestWorld.Build(
                HttpMethod.Post, "/api/businesses/current/appointments/counter",
                new CounterAppointmentRequest(business.Services[0].Id, business.ProfessionalIds[0], TestCalendar.At(10), "Balcão", null, null),
                token));
            string body = await response.Content.ReadAsStringAsync();

            output.WriteLine($"I2 {environment}: {(int)response.StatusCode} {body}");
            Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
            foreach (string leak in new[] { secret, "Npgsql", "PostgresException", "INSERT", " at Booking.", "StackTrace", "\"exception\"" })
            {
                Assert.DoesNotContain(leak, body, StringComparison.OrdinalIgnoreCase);
            }

            // Os cabeçalhos de segurança também saem no 500 (o tratamento de erro limpa a resposta).
            Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        }
        finally
        {
            await ExecuteAsync($"DROP TRIGGER {trigger} ON scheduling.appointment; DROP FUNCTION scheduling.{trigger}();");
        }
    }

    [Fact]
    public async Task I3_responses_carry_the_security_headers()
    {
        using HttpResponseMessage response = await _world.SendAsync(HttpMethod.Get, "/api/consents/versions", null, null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").Single());
        Assert.Equal("no-referrer", response.Headers.GetValues("Referrer-Policy").Single());
        Assert.Equal("default-src 'none'; frame-ancestors 'none'", response.Headers.GetValues("Content-Security-Policy").Single());
    }

    /// <summary>
    /// Demonstração pública (Onda 7H): navegador → Cloudflare → cloudflared → nginx → API. O limitador de autenticação
    /// conta pelo IP de quem chamou, e não pelo do último proxy; um <c>X-Forwarded-For</c> inventado não troca de balde.
    /// </summary>
    [Fact]
    public async Task I4_behind_the_proxies_the_auth_limiter_counts_the_real_ip_and_ignores_a_forged_one()
    {
        await using var factory = new BookingApiFactory(
            fixture.ConnectionString,
            settings: new Dictionary<string, string> { ["ForwardedHeaders:KnownNetworks:0"] = "172.16.0.0/12" });
        using HttpClient client = factory.CreateClient();

        // À direita, o cloudflared (rede do compose); antes dele, o IP que a Cloudflare viu; à esquerda, o que o
        // navegador inventou, diferente a cada chamada.
        async Task<HttpStatusCode> RefreshAsync(string realIp, int attempt)
        {
            using HttpRequestMessage request = TestWorld.Build(HttpMethod.Post, "/api/auth/refresh", new RefreshSessionRequest("token-invalido"), null);
            request.Headers.Add("X-Forwarded-For", $"198.51.100.{attempt}, {realIp}, 172.18.0.5");
            using HttpResponseMessage response = await client.SendAsync(request);
            return response.StatusCode;
        }

        for (int attempt = 1; attempt <= 10; attempt++)
        {
            Assert.NotEqual(HttpStatusCode.TooManyRequests, await RefreshAsync("203.0.113.7", attempt));
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, await RefreshAsync("203.0.113.7", 11));
        Assert.NotEqual(HttpStatusCode.TooManyRequests, await RefreshAsync("203.0.113.8", 12));
    }

    /// <summary>
    /// O TLS termina na Cloudflare: a API recebe HTTP e só sabe que a origem era HTTPS pelo <c>X-Forwarded-Proto</c>.
    /// Fora de Development, com ele, sai o HSTS; sem ele (acesso local direto), não sai nem redireciona.
    /// </summary>
    [Fact]
    public async Task I5_outside_development_hsts_follows_the_forwarded_proto()
    {
        await using var factory = new BookingApiFactory(
            fixture.ConnectionString, "Production",
            settings: new Dictionary<string, string> { ["ForwardedHeaders:KnownNetworks:0"] = "172.16.0.0/12" });
        using HttpClient client = factory.CreateClient();

        async Task<HttpResponseMessage> GetAsync(string? proto)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, "/health");
            // O HSTS não sai para localhost; o endereço do túnel é um nome qualquer.
            request.Headers.Host = "demo.exemplo.test";
            if (proto is not null)
            {
                request.Headers.Add("X-Forwarded-For", "203.0.113.7, 172.18.0.5");
                request.Headers.Add("X-Forwarded-Proto", proto);
            }

            return await client.SendAsync(request);
        }

        using HttpResponseMessage viaTunnel = await GetAsync("https");
        Assert.Equal(HttpStatusCode.OK, viaTunnel.StatusCode);
        Assert.StartsWith("max-age=", viaTunnel.Headers.GetValues("Strict-Transport-Security").Single());

        using HttpResponseMessage direct = await GetAsync(null);
        Assert.Equal(HttpStatusCode.OK, direct.StatusCode);
        Assert.False(direct.Headers.Contains("Strict-Transport-Security"));
    }

    /// <summary>
    /// A chave do <c>.env.example</c> tem 32+ bytes e passaria na regra de tamanho. Fora de Development, a API não sobe
    /// com ela; em Development (o compose local), sobe.
    /// </summary>
    [Fact]
    public async Task I6_the_example_jwt_key_is_refused_outside_development()
    {
        string exampleKey = JwtOptions.PublicSigningKeys.Single();
        var settings = new Dictionary<string, string> { ["Jwt:SigningKey"] = exampleKey };

        await using (var production = new BookingApiFactory(fixture.ConnectionString, "Production", settings: settings))
        {
            Exception refused = Assert.ThrowsAny<Exception>(() => production.CreateClient());
            Assert.Contains("Jwt:SigningKey", Flatten(refused));
            Assert.DoesNotContain(exampleKey, Flatten(refused));
        }

        await using var development = new BookingApiFactory(fixture.ConnectionString, "Development", settings: settings);
        using HttpClient client = development.CreateClient();
        using HttpResponseMessage health = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, health.StatusCode);
    }

    private static string Flatten(Exception e) => e.InnerException is null ? e.Message : $"{e.Message} {Flatten(e.InnerException)}";

    /// <summary>
    /// Token emitido pela própria instância (cada factory tem a sua chave), com o contexto do dono. Antes de qualquer
    /// requisição, confere que a instância aponta para o banco da execução, e não para outro.
    /// </summary>
    private async Task<string> OwnerTokenAsync(BookingApiFactory factory, TestBusiness business)
    {
        await using AsyncServiceScope scope = factory.Services.CreateAsyncScope();
        BookingDbContext db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        Assert.Equal(
            new NpgsqlConnectionStringBuilder(fixture.ConnectionString).Database,
            new NpgsqlConnectionStringBuilder(db.Database.GetConnectionString()).Database);

        Guid ownerId = await db.Database
            .SqlQuery<Guid>($"SELECT user_id AS \"Value\" FROM tenancy.business_membership WHERE business_id = {business.Id} AND role = 'Owner'")
            .SingleAsync();
        User owner = await db.Set<User>().SingleAsync(u => u.Id == ownerId);

        return scope.ServiceProvider.GetRequiredService<IAccessTokenIssuer>()
            .Issue(owner, DateTimeOffset.UtcNow, new BusinessContext(business.Id, "Owner")).Value;
    }

    private async Task ExecuteAsync(string sql)
    {
        await using var connection = new NpgsqlConnection(fixture.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }
}
