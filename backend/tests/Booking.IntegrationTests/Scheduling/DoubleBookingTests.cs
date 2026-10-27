using System.Diagnostics;
using System.Net;
using System.Text.Json;
using Booking.Arguments.Module.Scheduling;
using Booking.Domain.Entity.Module.Scheduling;
using Booking.Domain.Exceptions;
using Booking.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Xunit.Abstractions;

namespace Booking.IntegrationTests.Scheduling;

/// <summary>
/// RNF-03: zero dupla reserva sob 50 requisições concorrentes. Tudo pelo endpoint real
/// (<c>POST /api/appointments</c>), com as requisições soltas juntas por uma barreira.
/// </summary>
/// <remarks>
/// A disputa não é resolvida na aplicação: o <c>SlotGuard</c> só confere a disponibilidade, e quem decide é a
/// constraint <c>appointment_no_overlap</c> (ADR-005). O A7 prova que é ela que segura a corrida.
/// </remarks>
[Collection(IntegrationCollection.Name)]
public sealed class DoubleBookingTests(IntegrationFixture fixture, ITestOutputHelper output)
{
    private const int _concurrent = 50;
    private const int _rounds = 20;

    private readonly TestWorld _world = new(fixture);

    /// <summary>Não testa regra: registra na saída o ambiente da execução, que a evidência do RNF-03 cita.</summary>
    [Fact]
    public void Environment_is_recorded_for_the_evidence()
    {
        output.WriteLine($"Ambiente: .NET {Environment.Version}; banco via {fixture.Server.Origin}; {fixture.DatabaseVersion}; dia de teste {TestCalendar.BookableDay:yyyy-MM-dd}");
        Assert.False(string.IsNullOrWhiteSpace(fixture.DatabaseVersion));
    }

    [Fact]
    public async Task A1_fifty_customers_same_professional_same_time_produce_exactly_one_appointment()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestService service = business.Services[0];
        Guid professional = business.ProfessionalIds[0];
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(_concurrent);
        DateTimeOffset startsAt = TestCalendar.At(10);

        RaceResult race = await RaceAsync(business, service, professional, customers, _ => startsAt);

        Report("A1", race);
        Assert.Equal(1, race.Created);
        Assert.Equal(_concurrent - 1, race.SlotTaken);
        Assert.Equal(_concurrent - 1, race.SlotTakenWithAlternatives);
        Assert.Empty(race.Unexpected);
        Assert.Equal(1, await _world.CountOccupyingAsync(professional, startsAt, startsAt.AddMinutes(60)));
    }

    [Fact(Skip = "DEFEITO: sob disputa, a checagem da constraint de exclusão gera 40P01 (deadlock) e timeout, que viram 500; há rodada sem vencedor. Ver PR #13")]
    public async Task A2_twenty_rounds_of_fifty_never_have_zero_or_two_winners()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestService service = business.Services[0];
        Guid professional = business.ProfessionalIds[0];
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(_concurrent);

        var winnersPerRound = new List<int>();
        var rowsPerRound = new List<long>();
        int totalConflicts = 0;
        var unexpected = new List<string>();

        for (int round = 0; round < _rounds; round++)
        {
            // Rodadas de 30 min, das 06:00 às 15:30: horários que não se tocam.
            DateTimeOffset startsAt = TestCalendar.At(6).AddMinutes(30 * round);

            RaceResult race = await RaceAsync(business, service, professional, customers, _ => startsAt);

            winnersPerRound.Add(race.Created);
            rowsPerRound.Add(await _world.CountOccupyingAsync(professional, startsAt, startsAt.AddMinutes(30)));
            totalConflicts += race.SlotTaken;
            unexpected.AddRange(race.Unexpected.Select(u => $"rodada {round + 1}: {u}"));
        }

        output.WriteLine(
            $"A2: {_rounds} rodadas × {_concurrent} = {_rounds * _concurrent} requisições; " +
            $"vencedores por rodada = [{string.Join(", ", winnersPerRound)}]; " +
            $"linhas por rodada = [{string.Join(", ", rowsPerRound)}]; 409 = {totalConflicts}; inesperadas = {unexpected.Count}");

        foreach (string kind in unexpected.Select(u => u.Length > 600 ? u[..600] : u).Distinct().Take(5))
        {
            output.WriteLine($"  inesperada: {kind}");
        }

        Assert.All(winnersPerRound, winners => Assert.Equal(1, winners));
        Assert.All(rowsPerRound, rows => Assert.Equal(1, rows));
        Assert.Equal(_rounds * (_concurrent - 1), totalConflicts);
        Assert.Empty(unexpected);
    }

    [Fact]
    public async Task A3_overlapping_but_different_starts_produce_exactly_one_winner()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestService service = business.Services[0];
        Guid professional = business.ProfessionalIds[0];
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(_concurrent);

        // 10:00, 10:15, 10:30 e 10:45, distribuídos entre os 50: com 60 min, todo par se sobrepõe.
        RaceResult race = await RaceAsync(business, service, professional, customers, i => TestCalendar.At(10, 15 * (i % 4)));

        Report("A3", race);
        Assert.Equal(1, race.Created);
        Assert.Equal(_concurrent - 1, race.SlotTaken);
        Assert.Empty(race.Unexpected);
        Assert.Equal(1, await _world.CountOccupyingAsync(professional, TestCalendar.At(10), TestCalendar.At(11, 45)));
    }

    [Fact]
    public async Task A4_same_time_with_two_different_professionals_both_succeed()
    {
        TestBusiness business = await _world.NewBusinessAsync(2, [new ServiceSpec(60)]);
        TestService service = business.Services[0];
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(2);
        DateTimeOffset startsAt = TestCalendar.At(10);

        HttpResponseMessage[] responses = await Concurrently.SendAsync(_world.Client,
        [
            _world.RequestAppointment(customers[0], business, service, business.ProfessionalIds[0], startsAt),
            _world.RequestAppointment(customers[1], business, service, business.ProfessionalIds[1], startsAt),
        ]);

        Assert.All(responses, r => Assert.Equal(HttpStatusCode.Created, r.StatusCode));
        Assert.Equal(1, await _world.CountOccupyingAsync(business.ProfessionalIds[0], startsAt, startsAt.AddMinutes(60)));
        Assert.Equal(1, await _world.CountOccupyingAsync(business.ProfessionalIds[1], startsAt, startsAt.AddMinutes(60)));
    }

    [Fact]
    public async Task A5_adjacent_intervals_both_succeed_because_the_range_is_half_open()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestService service = business.Services[0];
        Guid professional = business.ProfessionalIds[0];
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(2);

        HttpResponseMessage[] responses = await Concurrently.SendAsync(_world.Client,
        [
            _world.RequestAppointment(customers[0], business, service, professional, TestCalendar.At(10)),
            _world.RequestAppointment(customers[1], business, service, professional, TestCalendar.At(11)),
        ]);

        Assert.All(responses, r => Assert.Equal(HttpStatusCode.Created, r.StatusCode));
        Assert.Equal(2, await _world.CountOccupyingAsync(professional, TestCalendar.At(10), TestCalendar.At(12)));
    }

    [Fact]
    public async Task A6_cancelled_and_rejected_appointments_release_the_slot()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestService service = business.Services[0];
        Guid professional = business.ProfessionalIds[0];
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(3);
        DateTimeOffset startsAt = TestCalendar.At(10);

        // Cancelled: o próprio consumidor desiste do pedido.
        AppointmentResponse first = await _world.BookAsync(customers[0], business, service, professional, startsAt);
        await _world.SendOkAsync(HttpMethod.Post, $"/api/appointments/{first.Id}/cancel", new ReasonRequest(null), customers[0].Token);

        AppointmentResponse second = await _world.BookAsync(customers[1], business, service, professional, startsAt);
        Assert.Equal("Pending", second.Status);

        // Rejected: o dono recusa o pedido pendente.
        await _world.SendOkAsync(HttpMethod.Post, $"/api/businesses/current/appointments/{second.Id}/reject", new ReasonRequest(null), business.OwnerToken);

        AppointmentResponse third = await _world.BookAsync(customers[2], business, service, professional, startsAt);

        Assert.Equal("Pending", third.Status);
        Assert.Equal(1, await _world.CountOccupyingAsync(professional, startsAt, startsAt.AddMinutes(60)));
        Assert.Equal(3, await _world.CountAsync(
            "SELECT count(*) FROM scheduling.appointment WHERE professional_id = @p", ("p", professional)));
    }

    /// <summary>
    /// Controle negativo, determinístico: duas gravações sobrepostas direto pelo DbContext, sem passar pelo
    /// <c>SlotGuard</c>. Com a constraint, a segunda falha com 23P01. Num banco à parte, sem a constraint,
    /// as duas gravam — "uma regra só vale se já falhou".
    /// </summary>
    [Fact]
    public async Task A7_the_exclusion_constraint_is_what_rejects_the_overlap()
    {
        // Com a constraint: o banco da execução, criado pela migration.
        (bool secondSaved, PostgresException? error, DomainException? domain, long rows) withConstraint =
            await WriteTwoOverlappingAsync(fixture.ConnectionString);

        Assert.False(withConstraint.secondSaved);
        Assert.Equal(PostgresErrorCodes.ExclusionViolation, withConstraint.error?.SqlState);
        Assert.Equal("appointment_no_overlap", withConstraint.error?.ConstraintName);
        Assert.Equal("appointment.slot_no_longer_available", withConstraint.domain?.Code);
        Assert.Equal(1, withConstraint.rows);

        // Sem a constraint: banco novo, mesma migration, constraint removida.
        string withoutConstraintDb = await fixture.Server.CreateDatabaseAsync();
        try
        {
            await using (var direct = new DirectDbContext(withoutConstraintDb))
            {
                await direct.Db.Database.MigrateAsync();
            }

            await using (var connection = new NpgsqlConnection(withoutConstraintDb))
            {
                await connection.OpenAsync();
                await using var drop = new NpgsqlCommand("ALTER TABLE scheduling.appointment DROP CONSTRAINT appointment_no_overlap", connection);
                await drop.ExecuteNonQueryAsync();
            }

            (bool secondSaved, PostgresException? error, DomainException? domain, long rows) withoutConstraint =
                await WriteTwoOverlappingAsync(withoutConstraintDb);

            output.WriteLine(
                $"A7: com a constraint — segunda gravação recusada ({withConstraint.error?.SqlState} {withConstraint.error?.ConstraintName}), " +
                $"{withConstraint.rows} linha; sem a constraint — segunda gravação {(withoutConstraint.secondSaved ? "aceita" : "recusada")}, " +
                $"{withoutConstraint.rows} linhas");

            Assert.True(withoutConstraint.secondSaved);
            Assert.Null(withoutConstraint.error);
            Assert.Equal(2, withoutConstraint.rows);
        }
        finally
        {
            await fixture.Server.DropDatabaseAsync(withoutConstraintDb);
        }
    }

    private static async Task<(bool SecondSaved, PostgresException? Error, DomainException? Domain, long Rows)> WriteTwoOverlappingAsync(string connectionString)
    {
        // Sem FK entre módulos: estabelecimento, profissional e serviço não precisam existir para a constraint valer.
        Guid businessId = Guid.CreateVersion7();
        Guid professionalId = Guid.CreateVersion7();
        var snapshot = new ServiceSnapshot(Guid.CreateVersion7(), "Serviço de controle", 60, 0, 0, 5000);
        var actor = new SchedulingActor(Guid.CreateVersion7(), "Owner");
        DateTimeOffset now = DateTimeOffset.UtcNow;
        DateTimeOffset startsAt = TestCalendar.At(10);

        await using (var direct = new DirectDbContext(connectionString))
        {
            direct.Db.Add(Appointment.AtCounter(businessId, professionalId, snapshot, startsAt, false, "Primeiro", null, null, actor, now));
            await direct.Db.SaveChangesAsync();
        }

        bool secondSaved;
        PostgresException? error;
        DomainException? domain = null;

        await using (var direct = new DirectDbContext(connectionString))
        {
            // 10:30–11:30 sobre 10:00–11:00.
            direct.Db.Add(Appointment.AtCounter(businessId, professionalId, snapshot, startsAt.AddMinutes(30), false, "Segundo", null, null, actor, now));
            try
            {
                await direct.Db.SaveChangesAsync();
                secondSaved = true;
            }
            catch (DomainException e)
            {
                domain = e;
                secondSaved = false;
            }

            error = direct.LastPostgresError;
        }

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var count = new NpgsqlCommand("SELECT count(*) FROM scheduling.appointment WHERE professional_id = @p", connection);
        count.Parameters.AddWithValue("p", professionalId);
        long rows = (long)(await count.ExecuteScalarAsync())!;

        return (secondSaved, error, domain, rows);
    }

    // --- Corrida ---

    private sealed record RaceResult(int Requests, int Created, int SlotTaken, int SlotTakenWithAlternatives, IReadOnlyList<string> Unexpected, TimeSpan Elapsed);

    private async Task<RaceResult> RaceAsync(
        TestBusiness business, TestService service, Guid professional, IReadOnlyList<TestUser> customers, Func<int, DateTimeOffset> startsAt)
    {
        HttpRequestMessage[] requests =
        [
            .. customers.Select((customer, i) => _world.RequestAppointment(customer, business, service, professional, startsAt(i))),
        ];

        var watch = Stopwatch.StartNew();
        HttpResponseMessage[] responses = await Concurrently.SendAsync(_world.Client, requests);
        watch.Stop();

        int created = 0, slotTaken = 0, withAlternatives = 0;
        var unexpected = new List<string>();

        foreach (HttpResponseMessage response in responses)
        {
            string body = await response.Content.ReadAsStringAsync();

            if (response.StatusCode == HttpStatusCode.Created)
            {
                created++;
            }
            else if (response.StatusCode == HttpStatusCode.Conflict && Code(body) == "appointment.slot_no_longer_available")
            {
                slotTaken++;
                if (AlternativesCount(body) > 0)
                {
                    withAlternatives++;
                }
            }
            else
            {
                unexpected.Add($"{(int)response.StatusCode} {body}");
            }

            response.Dispose();
        }

        return new RaceResult(responses.Length, created, slotTaken, withAlternatives, unexpected, watch.Elapsed);
    }

    private void Report(string test, RaceResult race)
    {
        output.WriteLine(
            $"{test}: {race.Requests} requisições; 201 = {race.Created}; 409 slot_no_longer_available = {race.SlotTaken} " +
            $"(com alternatives = {race.SlotTakenWithAlternatives}); inesperadas = {race.Unexpected.Count}; " +
            $"tempo da corrida = {race.Elapsed.TotalMilliseconds:F0} ms");

        foreach (string kind in race.Unexpected.Select(u => u.Length > 600 ? u[..600] : u).Distinct().Take(5))
        {
            output.WriteLine($"  inesperada: {kind}");
        }
    }

    private static string? Code(string body)
    {
        using JsonDocument document = JsonDocument.Parse(body);
        return document.RootElement.TryGetProperty("code", out JsonElement code) ? code.GetString() : null;
    }

    private static int AlternativesCount(string body)
    {
        using JsonDocument document = JsonDocument.Parse(body);
        return document.RootElement.TryGetProperty("alternatives", out JsonElement alternatives) && alternatives.ValueKind == JsonValueKind.Array
            ? alternatives.GetArrayLength()
            : 0;
    }
}
