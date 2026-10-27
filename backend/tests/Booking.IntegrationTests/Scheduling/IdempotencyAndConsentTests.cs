using System.Net;
using System.Net.Http.Json;
using Booking.Arguments.Module.Compliance;
using Booking.Arguments.Module.Scheduling;
using Booking.IntegrationTests.Infrastructure;
using Xunit.Abstractions;

namespace Booking.IntegrationTests.Scheduling;

/// <summary>Idempotência do pedido (toque duplo e retry) e o bloqueio por consentimento em categoria sensível.</summary>
[Collection(IntegrationCollection.Name)]
public sealed class IdempotencyAndConsentTests(IntegrationFixture fixture, ITestOutputHelper output)
{
    private readonly TestWorld _world = new(fixture);

    [Fact]
    public async Task C1_same_idempotency_key_sequentially_returns_the_same_appointment()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser customer = await _world.NewCustomerAsync();
        string key = Guid.NewGuid().ToString("N");

        AppointmentResponse first = await SendAsync(customer, business, key);
        AppointmentResponse second = await SendAsync(customer, business, key);

        Assert.Equal(first.Id, second.Id);
        Assert.Equal(1, await RowsWithKeyAsync(customer, key));
    }

    [Fact(Skip = "DEFEITO: chave de idempotência repetida ao mesmo tempo devolve 400 appointment.duplicate_request em vez do agendamento. Ver PR #13")]
    public async Task C2_same_idempotency_key_twenty_times_at_once_returns_the_same_appointment()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser customer = await _world.NewCustomerAsync();
        string key = Guid.NewGuid().ToString("N");

        HttpRequestMessage[] requests =
        [
            .. Enumerable.Range(0, 20).Select(_ =>
                _world.RequestAppointment(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10), key)),
        ];

        HttpResponseMessage[] responses = await Concurrently.SendAsync(_world.Client, requests);

        var statuses = new List<string>();
        var ids = new HashSet<Guid>();
        foreach (HttpResponseMessage response in responses)
        {
            if (response.IsSuccessStatusCode)
            {
                ids.Add((await response.Content.ReadFromJsonAsync<AppointmentResponse>(TestWorld.Json))!.Id);
                statuses.Add(((int)response.StatusCode).ToString());
            }
            else
            {
                statuses.Add($"{(int)response.StatusCode} {await TestWorld.ErrorCodeAsync(response)}");
            }
        }

        long rows = await RowsWithKeyAsync(customer, key);
        output.WriteLine(
            $"C2: 20 requisições simultâneas, mesma chave; respostas = " +
            $"{string.Join("; ", statuses.GroupBy(s => s).Select(g => $"{g.Key} × {g.Count()}"))}; ids distintos = {ids.Count}; linhas = {rows}");

        // Comportamento desejado: toda resposta é o mesmo agendamento, nenhum 400/409/500.
        Assert.All(responses, r => Assert.True(r.IsSuccessStatusCode, $"veio {(int)r.StatusCode}"));
        Assert.Single(ids);
        Assert.Equal(1, rows);
    }

    [Fact]
    public async Task C3_health_business_without_consent_refuses_the_request()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], category: "Saude");
        TestUser customer = await _world.NewCustomerAsync();

        using HttpResponseMessage response = await _world.Client.SendAsync(
            _world.RequestAppointment(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10)));

        string? code = await TestWorld.ErrorCodeAsync(response);
        output.WriteLine($"C3: {(int)response.StatusCode} {code}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("compliance.consent_required", code);
        Assert.Equal(0, await _world.CountAsync(
            "SELECT count(*) FROM scheduling.appointment WHERE business_id = @b", ("b", business.Id)));
    }

    /// <summary>
    /// Com consentimento vigente o pedido passa e nasce sensível. O log de acesso (LGPD, Art. 11) registra o acesso
    /// do estabelecimento ao agendamento, não a criação pelo próprio consumidor: zero entradas depois do pedido,
    /// uma depois de o dono confirmar.
    /// </summary>
    [Fact]
    public async Task C4_health_business_with_consent_creates_a_sensitive_appointment_and_logs_business_access()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], category: "Saude");
        TestUser customer = await _world.NewCustomerAsync();

        ConsentVersionsResponse versions = await _world.SendOkAsync<ConsentVersionsResponse>(
            HttpMethod.Get, "/api/consents/versions", null, customer.Token);
        await _world.SendOkAsync(
            HttpMethod.Post, "/api/consents", new GrantConsentRequest("SensitiveScheduling", versions.SensitiveScheduling), customer.Token);

        AppointmentResponse appointment = await _world.BookAsync(
            customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));

        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM scheduling.appointment WHERE id = @id AND is_sensitive", ("id", appointment.Id)));
        long logsAfterRequest = await LogsOfAsync(appointment.Id);

        await _world.SendOkAsync(
            HttpMethod.Post, $"/api/businesses/current/appointments/{appointment.Id}/confirm", null, business.OwnerToken);
        long logsAfterConfirm = await LogsOfAsync(appointment.Id);

        output.WriteLine($"C4: is_sensitive = true; entradas no log de acesso: após o pedido = {logsAfterRequest}, após a confirmação = {logsAfterConfirm}");

        Assert.Equal(0, logsAfterRequest);
        Assert.Equal(1, logsAfterConfirm);
    }

    private async Task<AppointmentResponse> SendAsync(TestUser customer, TestBusiness business, string key)
    {
        using HttpResponseMessage response = await _world.Client.SendAsync(
            _world.RequestAppointment(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10), key));
        await TestWorld.EnsureSuccessAsync(response);
        return (await response.Content.ReadFromJsonAsync<AppointmentResponse>(TestWorld.Json))!;
    }

    private Task<long> RowsWithKeyAsync(TestUser customer, string key) =>
        _world.CountAsync(
            "SELECT count(*) FROM scheduling.appointment WHERE customer_id = @c AND idempotency_key = @k",
            ("c", customer.CustomerId!.Value), ("k", key));

    private Task<long> LogsOfAsync(Guid appointmentId) =>
        _world.CountAsync("SELECT count(*) FROM compliance.sensitive_access_log WHERE appointment_id = @id", ("id", appointmentId));
}
