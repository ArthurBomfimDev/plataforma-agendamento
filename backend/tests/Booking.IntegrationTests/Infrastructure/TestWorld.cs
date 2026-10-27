using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Booking.Application.Contracts.Identity;
using Booking.Arguments.Module.Availability;
using Booking.Arguments.Module.Catalog;
using Booking.Arguments.Module.Identity;
using Booking.Arguments.Module.People;
using Booking.Arguments.Module.Scheduling;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.ValueObject;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Booking.IntegrationTests.Infrastructure;

public sealed record TestUser(Guid UserId, Guid? CustomerId, string Token);

public sealed record TestService(Guid Id, int DurationMinutes);

public sealed record TestBusiness(
    Guid Id,
    string Name,
    string OwnerToken,
    IReadOnlyList<Guid> ProfessionalIds,
    IReadOnlyList<Guid> WorkScheduleIds,
    IReadOnlyList<TestService> Services);

/// <summary>Serviço a criar: duração, buffers, preço e nome. O passo de grade é sempre 15 min.</summary>
public sealed record ServiceSpec(
    int DurationMinutes, int BufferBeforeMinutes = 0, int BufferAfterMinutes = 0, long PriceCents = 5000, string? Name = null);

/// <summary>Ponto do estabelecimento. O padrão é Garça-SP; a busca usa pontos próprios para não ver outros testes.</summary>
public sealed record TestLocation(double Latitude, double Longitude)
{
    public static readonly TestLocation Garca = new(-22.2125, -49.6564);

    /// <summary>Um ponto em lugar nenhum perto dos outros testes: cada teste de busca pega o seu.</summary>
    public static TestLocation Isolated() =>
        new(-10 - Random.Shared.NextDouble() * 5, -40 - Random.Shared.NextDouble() * 5);

    /// <summary>A <paramref name="meters"/> metros ao norte (1° de latitude ≈ 111 km).</summary>
    public TestLocation North(double meters) => this with { Latitude = Latitude + meters / 111_000 };
}

/// <summary>
/// Monta os dados de cada teste com ids novos — nada é compartilhado entre testes, nada é truncado.
/// </summary>
/// <remarks>
/// Usuários e consumidores são gravados direto pelo <see cref="BookingDbContext"/>, e o token sai do
/// <see cref="IAccessTokenIssuer"/> registrado na API: <c>register</c>/<c>login</c> têm limite de 10 por minuto
/// por IP, e 50 consumidores estourariam o limite. O estabelecimento é montado pela API, na ordem do
/// <c>scripts/seed-demo.ts</c>.
/// </remarks>
public sealed class TestWorld(IntegrationFixture fixture)
{
    public const string TimeZone = "America/Sao_Paulo";

    public static readonly JsonSerializerOptions Json = JsonSerializerOptions.Web;

    public HttpClient Client => fixture.Client;

    // --- Pessoas ---

    public async Task<IReadOnlyList<TestUser>> NewCustomersAsync(int count)
    {
        await using AsyncServiceScope scope = fixture.Factory.Services.CreateAsyncScope();
        BookingDbContext db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
        IAccessTokenIssuer tokens = scope.ServiceProvider.GetRequiredService<IAccessTokenIssuer>();
        DateTimeOffset now = DateTimeOffset.UtcNow;
        DateOnly today = DateOnly.FromDateTime(now.UtcDateTime);

        var created = new List<(User User, Customer Customer)>();
        for (int i = 0; i < count; i++)
        {
            User user = User.Create(Email.Of($"it-{Guid.NewGuid():N}@exemplo.test"), fixture.PasswordHash, $"Consumidor de teste {i + 1}");
            Customer customer = Customer.Create(user.Id, new DateOnly(1990, 1, 1), null, today);
            db.Add(user);
            db.Add(customer);
            created.Add((user, customer));
        }

        await db.SaveChangesAsync();

        return [.. created.Select(c => new TestUser(c.User.Id, c.Customer.Id, tokens.Issue(c.User, now).Value))];
    }

    public async Task<TestUser> NewCustomerAsync() => (await NewCustomersAsync(1))[0];

    /// <summary>Usuário sem perfil de consumidor: o dono, antes de criar o estabelecimento.</summary>
    public async Task<TestUser> NewUserAsync(string fullName)
    {
        await using AsyncServiceScope scope = fixture.Factory.Services.CreateAsyncScope();
        BookingDbContext db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
        IAccessTokenIssuer tokens = scope.ServiceProvider.GetRequiredService<IAccessTokenIssuer>();

        User user = User.Create(Email.Of($"it-{Guid.NewGuid():N}@exemplo.test"), fixture.PasswordHash, fullName);
        db.Add(user);
        await db.SaveChangesAsync();

        return new TestUser(user.Id, null, tokens.Issue(user, DateTimeOffset.UtcNow).Value);
    }

    // --- Estabelecimento ---

    public async Task<TestBusiness> NewBusinessAsync(
        int professionals, ServiceSpec[] services, string category = "Beleza", bool approve = true, TestLocation? location = null)
    {
        TestUser owner = await NewUserAsync("Dono de teste");
        string name = $"Estabelecimento {Guid.NewGuid():N}"[..40];

        BusinessResponse business = await SendOkAsync<BusinessResponse>(
            HttpMethod.Post, "/api/businesses",
            new RegisterBusinessRequest(name, Cnpj.Random(), category), owner.Token);

        // O token precisa carregar o estabelecimento ativo para as rotas `businesses/current` (ADR-004).
        ContextTokenResponse context = await SendOkAsync<ContextTokenResponse>(
            HttpMethod.Post, "/api/users/me/context", new SwitchContextRequest(business.Id), owner.Token);
        string token = context.AccessToken;

        await SendOkAsync(HttpMethod.Put, "/api/businesses/current/address",
            new UpdateAddressRequest("Rua de Teste", "100", "Centro", "Garça", "SP", "17400000"), token);
        await SendOkAsync(HttpMethod.Put, "/api/businesses/current/location",
            new ConfirmLocationRequest((location ?? TestLocation.Garca).Latitude, (location ?? TestLocation.Garca).Longitude, "Rooftop", "integration-test"), token);
        await SendOkAsync(HttpMethod.Put, "/api/businesses/current/scheduling-policy",
            new UpdateSchedulingPolicyRequest(
                AutoConfirm: false, PendingExpirationHours: 12, MinLeadTimeHours: 2, BookingHorizonDays: 60,
                CancellationWindowHours: 24, TimeZone: TimeZone), token);

        DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-1);
        var professionalIds = new List<Guid>();
        var scheduleIds = new List<Guid>();

        for (int p = 0; p < professionals; p++)
        {
            ProfessionalResponse professional = await SendOkAsync<ProfessionalResponse>(
                HttpMethod.Post, "/api/businesses/current/professionals",
                new CreateProfessionalRequest($"Profissional {p + 1}", null, null, IsMe: false), token);
            professionalIds.Add(professional.Id);

            // Jornada de 06:00 às 22:00 todos os dias: cobre qualquer horário que os testes usam.
            foreach (DayOfWeek day in Enum.GetValues<DayOfWeek>())
            {
                WorkScheduleResponse schedule = await SendOkAsync<WorkScheduleResponse>(
                    HttpMethod.Post, "/api/businesses/current/work-schedules",
                    new AddWorkScheduleRequest(professional.Id, day, new TimeOnly(6, 0), new TimeOnly(22, 0), today, null), token);
                scheduleIds.Add(schedule.Id);
            }
        }

        var createdServices = new List<TestService>();
        foreach (ServiceSpec spec in services)
        {
            ServiceResponse service = await SendOkAsync<ServiceResponse>(
                HttpMethod.Post, "/api/businesses/current/services",
                new SaveServiceRequest(
                    spec.Name ?? $"Serviço {spec.DurationMinutes} min", null, spec.DurationMinutes, spec.BufferBeforeMinutes,
                    spec.BufferAfterMinutes, SlotStepMinutes: 15, PriceCents: spec.PriceCents, SuppliesNote: null), token);
            createdServices.Add(new TestService(service.Id, spec.DurationMinutes));

            foreach (Guid professionalId in professionalIds)
            {
                await SendOkAsync(HttpMethod.Put, $"/api/businesses/current/services/{service.Id}/professionals/{professionalId}",
                    new EnableProfessionalRequest(null, null), token);
            }
        }

        await SendOkAsync(HttpMethod.Post, "/api/businesses/current/submit", null, token);

        if (approve)
        {
            TestUser admin = await NewAdminAsync();
            await SendOkAsync(HttpMethod.Post, $"/api/admin/businesses/{business.Id}/approve", new AdminDecisionRequest("Aprovado no teste"), admin.Token);
        }

        return new TestBusiness(business.Id, name, token, professionalIds, scheduleIds, createdServices);
    }

    /// <summary>
    /// Admin da plataforma (ADR-020). O papel nunca é concedido por endpoint: aqui, pelo domínio direto no banco,
    /// como faria o seed.
    /// </summary>
    public async Task<TestUser> NewAdminAsync()
    {
        await using AsyncServiceScope scope = fixture.Factory.Services.CreateAsyncScope();
        BookingDbContext db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
        IAccessTokenIssuer tokens = scope.ServiceProvider.GetRequiredService<IAccessTokenIssuer>();

        User user = User.Create(Email.Of($"it-admin-{Guid.NewGuid():N}@exemplo.test"), fixture.PasswordHash, "Admin de teste");
        user.GrantPlatformAdmin();
        db.Add(user);
        await db.SaveChangesAsync();

        return new TestUser(user.Id, null, tokens.Issue(user, DateTimeOffset.UtcNow).Value);
    }

    // --- Agendamento ---

    public HttpRequestMessage RequestAppointment(
        TestUser customer, TestBusiness business, TestService service, Guid professionalId, DateTimeOffset startsAt, string? idempotencyKey = null) =>
        Build(HttpMethod.Post, "/api/appointments",
            new RequestAppointmentRequest(business.Id, service.Id, professionalId, startsAt, null, null, idempotencyKey ?? Guid.NewGuid().ToString("N")),
            customer.Token);

    public async Task<AppointmentResponse> BookAsync(
        TestUser customer, TestBusiness business, TestService service, Guid professionalId, DateTimeOffset startsAt)
    {
        using HttpResponseMessage response = await Client.SendAsync(RequestAppointment(customer, business, service, professionalId, startsAt));
        await EnsureStatusAsync(response, HttpStatusCode.Created);
        return (await response.Content.ReadFromJsonAsync<AppointmentResponse>(Json))!;
    }

    // --- HTTP ---

    public static HttpRequestMessage Build(HttpMethod method, string path, object? body, string? token)
    {
        var request = new HttpRequestMessage(method, path);

        if (body is not null)
        {
            request.Content = JsonContent.Create(body, body.GetType(), options: Json);
        }

        if (token is not null)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return request;
    }

    public Task<HttpResponseMessage> SendAsync(HttpMethod method, string path, object? body, string? token) =>
        Client.SendAsync(Build(method, path, body, token));

    public async Task SendOkAsync(HttpMethod method, string path, object? body, string token)
    {
        using HttpResponseMessage response = await SendAsync(method, path, body, token);
        await EnsureSuccessAsync(response);
    }

    public async Task<T> SendOkAsync<T>(HttpMethod method, string path, object? body, string token)
    {
        using HttpResponseMessage response = await SendAsync(method, path, body, token);
        await EnsureSuccessAsync(response);
        return (await response.Content.ReadFromJsonAsync<T>(Json))!;
    }

    public static async Task EnsureSuccessAsync(HttpResponseMessage response)
    {
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"{response.RequestMessage?.Method} {response.RequestMessage?.RequestUri} → {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        }
    }

    public static async Task EnsureStatusAsync(HttpResponseMessage response, HttpStatusCode expected)
    {
        if (response.StatusCode != expected)
        {
            Assert.Fail(
                $"{response.RequestMessage?.Method} {response.RequestMessage?.RequestUri}: esperado {(int)expected}, " +
                $"veio {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        }
    }

    /// <summary>O <c>code</c> estável do ProblemDetails, ou nulo quando o corpo não é um.</summary>
    public static async Task<string?> ErrorCodeAsync(HttpResponseMessage response)
    {
        string body = await response.Content.ReadAsStringAsync();
        if (string.IsNullOrWhiteSpace(body))
        {
            return null;
        }

        using JsonDocument document = JsonDocument.Parse(body);
        return document.RootElement.TryGetProperty("code", out JsonElement code) ? code.GetString() : null;
    }

    // --- Banco, lido por fora da API (sem filtro de tenant) ---

    public async Task<long> CountAsync(string sql, params (string Name, object Value)[] parameters)
    {
        await using var connection = new NpgsqlConnection(fixture.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);

        foreach ((string name, object value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        return Convert.ToInt64(await command.ExecuteScalarAsync());
    }

    /// <summary>Linhas que ocupam o horário do profissional no intervalo — o mesmo predicado da constraint.</summary>
    public Task<long> CountOccupyingAsync(Guid professionalId, DateTimeOffset from, DateTimeOffset to) =>
        CountAsync(
            """
            SELECT count(*) FROM scheduling.appointment
            WHERE professional_id = @professional
              AND status IN ('Pending', 'Confirmed', 'Completed', 'NoShow')
              AND tstzrange(blocked_starts_at, blocked_ends_at, '[)') && tstzrange(@from, @to, '[)')
            """,
            ("professional", professionalId), ("from", from.ToUniversalTime()), ("to", to.ToUniversalTime()));
}
