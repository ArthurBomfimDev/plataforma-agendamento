using System.Net;
using System.Text.RegularExpressions;
using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Module.Scheduling.Commands;
using Booking.Arguments.Module.Compliance;
using Booking.Arguments.Module.Identity;
using Booking.Arguments.Module.Scheduling;
using Booking.Arguments.Module.Tenancy;
using Booking.Infrastructure.Module.Notifications;
using Booking.IntegrationTests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Booking.IntegrationTests.Notifications;

/// <summary>
/// Onda 5B: um teste por gatilho de e-mail, com o canal falso. O e-mail nunca sai na requisição: vai para a outbox, na
/// mesma transação, e só é entregue quando o despacho roda.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed partial class EmailTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    // --- Conta ---

    [Fact]
    public async Task M1_sign_up_sends_a_confirmation_link_that_works()
    {
        string email = $"it-mail-{Guid.NewGuid():N}@exemplo.test";

        using (HttpResponseMessage registered = await _world.SendAsync(
            HttpMethod.Post, "/api/auth/register", new RegisterUserRequest(email, "senha-de-teste-123", "Pessoa Nova"), null))
        {
            Assert.Equal(HttpStatusCode.Created, registered.StatusCode);
        }

        Assert.Empty(_world.Emails.To(email));
        await _world.DispatchAllAsync();

        EmailMessage message = Assert.Single(_world.Emails.To(email));
        Assert.StartsWith("Confirme seu e-mail", message.Subject);
        Assert.Contains("http://app.exemplo.test/#/confirmar-email?token=", message.TextBody);
        AssertPlainLayout(message);

        using HttpResponseMessage confirmed = await _world.SendAsync(
            HttpMethod.Post, "/api/auth/confirm-email", new ConfirmEmailRequest(TokenIn(message.TextBody)), null);
        Assert.True(confirmed.IsSuccessStatusCode, $"confirmar devolveu {(int)confirmed.StatusCode}");
    }

    [Fact]
    public async Task M2_forgot_password_sends_a_reset_link_that_works()
    {
        TestUser user = await _world.NewCustomerAsync();

        using (HttpResponseMessage forgot = await _world.SendAsync(
            HttpMethod.Post, "/api/auth/forgot-password", new ForgotPasswordRequest(user.Email), null))
        {
            Assert.True(forgot.IsSuccessStatusCode);
        }

        await _world.DispatchAllAsync();

        EmailMessage message = Assert.Single(_world.Emails.To(user.Email));
        Assert.StartsWith("Redefinição de senha", message.Subject);
        Assert.Contains("#/redefinir-senha?token=", message.TextBody);

        using HttpResponseMessage reset = await _world.SendAsync(
            HttpMethod.Post, "/api/auth/reset-password", new ResetPasswordRequest(TokenIn(message.TextBody), "outra-senha-de-teste-456"), null);
        Assert.True(reset.IsSuccessStatusCode, $"redefinir devolveu {(int)reset.StatusCode}");
    }

    // --- Agendamento ---

    [Fact]
    public async Task M3_new_pending_request_notifies_owner_and_professional_not_the_customer()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60, Name: "Corte de teste")]);
        TestUser staff = await _world.NewStaffAsync(business, professionalIndex: 0);
        TestUser customer = await _world.NewCustomerAsync();

        await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));

        // Gravado na outbox, não enviado na requisição.
        Assert.Empty(_world.Emails.To(business.OwnerEmail));
        await _world.DispatchAllAsync();

        foreach (string recipient in new[] { business.OwnerEmail, staff.Email })
        {
            EmailMessage message = Assert.Single(_world.Emails.To(recipient));
            Assert.StartsWith("Novo pedido: Corte de teste", message.Subject);
            Assert.Contains("#/painel/pedidos", message.TextBody);
        }

        Assert.Empty(_world.Emails.To(customer.Email));
    }

    [Fact]
    public async Task M4_confirmation_sends_the_customer_an_ics_invitation()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60, Name: "Corte de teste")]);
        TestUser customer = await _world.NewCustomerAsync();
        AppointmentResponse appointment = await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));

        await _world.SendOkAsync(HttpMethod.Post, $"/api/businesses/current/appointments/{appointment.Id}/confirm", null, business.OwnerToken);
        await _world.DispatchAllAsync();

        EmailMessage message = Assert.Single(_world.Emails.To(customer.Email));
        Assert.StartsWith($"Horário confirmado: {business.Name}", message.Subject);
        AssertIcs(message, appointment.Id);
        Assert.Contains("LOCATION:Rua de Teste", message.Attachment!.Content);
        Assert.Contains("SUMMARY:Corte de teste", message.Attachment.Content);
        Assert.Contains("https://maps.google.com/?q=", message.TextBody);
    }

    [Fact]
    public async Task M5_auto_confirmed_request_goes_straight_to_the_customer()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        await _world.SendOkAsync(HttpMethod.Put, "/api/businesses/current/scheduling-policy",
            new UpdateSchedulingPolicyRequest(AutoConfirm: true, 12, 2, 60, 24, TestWorld.TimeZone), business.OwnerToken);
        TestUser customer = await _world.NewCustomerAsync();

        AppointmentResponse appointment = await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));
        await _world.DispatchAllAsync();

        Assert.Equal("Confirmed", appointment.Status);
        AssertIcs(Assert.Single(_world.Emails.To(customer.Email)), appointment.Id);
        Assert.Empty(_world.Emails.To(business.OwnerEmail));
    }

    [Theory]
    [InlineData("reject", "Pedido não aceito")]
    [InlineData("cancel", "Horário cancelado")]
    public async Task M6_rejection_and_cancellation_by_the_business_tell_the_customer_why(string action, string subjectPrefix)
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser customer = await _world.NewCustomerAsync();
        AppointmentResponse appointment = await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));

        if (action == "cancel")
        {
            await _world.SendOkAsync(HttpMethod.Post, $"/api/businesses/current/appointments/{appointment.Id}/confirm", null, business.OwnerToken);
        }

        await _world.SendOkAsync(HttpMethod.Post, $"/api/businesses/current/appointments/{appointment.Id}/{action}",
            new ReasonRequest("Profissional em curso"), business.OwnerToken);
        await _world.DispatchAllAsync();

        EmailMessage message = _world.Emails.To(customer.Email).Single(m => m.Subject.StartsWith(subjectPrefix, StringComparison.Ordinal));
        Assert.Contains("Motivo informado: Profissional em curso", message.TextBody);
        Assert.Null(message.Attachment);
    }

    [Fact]
    public async Task M7_expired_request_tells_the_customer()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser customer = await _world.NewCustomerAsync();
        AppointmentResponse appointment = await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));

        await ExecuteAsync("UPDATE scheduling.appointment SET expires_at = now() - interval '1 minute' WHERE id = @id", ("id", appointment.Id));
        await using (AsyncServiceScope scope = fixture.Factory.Services.CreateAsyncScope())
        {
            await scope.ServiceProvider.GetRequiredService<ExpirePendingAppointmentsCommand>().ExecuteAsync();
        }

        await _world.DispatchAllAsync();

        EmailMessage message = Assert.Single(_world.Emails.To(customer.Email));
        Assert.StartsWith("Pedido expirado", message.Subject);
    }

    [Fact]
    public async Task M8_cancellation_by_the_customer_tells_owner_and_professional()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60, Name: "Corte de teste")]);
        TestUser staff = await _world.NewStaffAsync(business, professionalIndex: 0);
        TestUser customer = await _world.NewCustomerAsync();
        AppointmentResponse appointment = await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));

        await _world.SendOkAsync(HttpMethod.Post, $"/api/appointments/{appointment.Id}/cancel", new ReasonRequest(null), customer.Token);
        await _world.DispatchAllAsync();

        foreach (string recipient in new[] { business.OwnerEmail, staff.Email })
        {
            Assert.Single(_world.Emails.To(recipient), m => m.Subject.StartsWith("Cancelamento: Corte de teste", StringComparison.Ordinal));
        }
    }

    /// <summary>
    /// LGPD, Art. 11: em Saúde, assunto e prévia não citam serviço, categoria nem o nome do estabelecimento (o nome de
    /// uma clínica já diz a categoria). O corpo, para o titular, traz o serviço; o evento do calendário, não.
    /// </summary>
    [Fact]
    public async Task M9_health_subjects_and_previews_never_name_the_service_or_the_category()
    {
        TestBusiness clinic = await _world.NewBusinessAsync(1, [new ServiceSpec(60, Name: "Fisioterapia respiratória")], category: "Saude");
        TestUser customer = await _world.NewCustomerAsync();
        ConsentVersionsResponse versions = await _world.SendOkAsync<ConsentVersionsResponse>(HttpMethod.Get, "/api/consents/versions", null, customer.Token);
        await _world.SendOkAsync(HttpMethod.Post, "/api/consents", new GrantConsentRequest("SensitiveScheduling", versions.SensitiveScheduling), customer.Token);

        AppointmentResponse appointment = await _world.BookAsync(customer, clinic, clinic.Services[0], clinic.ProfessionalIds[0], TestCalendar.At(10));
        await _world.SendOkAsync(HttpMethod.Post, $"/api/businesses/current/appointments/{appointment.Id}/confirm", null, clinic.OwnerToken);
        await _world.DispatchAllAsync();

        EmailMessage toOwner = Assert.Single(_world.Emails.To(clinic.OwnerEmail));
        EmailMessage toCustomer = Assert.Single(_world.Emails.To(customer.Email));

        foreach (EmailMessage message in new[] { toOwner, toCustomer })
        {
            foreach (string forbidden in new[] { "Fisioterapia", "Saude", "Saúde", clinic.Name })
            {
                Assert.DoesNotContain(forbidden, message.Subject, StringComparison.OrdinalIgnoreCase);
                Assert.DoesNotContain(forbidden, message.Preheader, StringComparison.OrdinalIgnoreCase);
            }
        }

        Assert.Contains("Fisioterapia respiratória", toCustomer.TextBody);
        Assert.Contains($"SUMMARY:Atendimento — {clinic.Name}", toCustomer.Attachment!.Content);
        Assert.DoesNotContain("Fisioterapia", toCustomer.Attachment.Content);
    }

    [Fact]
    public async Task M10_refused_write_leaves_no_email_behind()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(2);

        await _world.BookAsync(customers[0], business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));
        using (HttpResponseMessage taken = await _world.Client.SendAsync(
            _world.RequestAppointment(customers[1], business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10))))
        {
            Assert.Equal(HttpStatusCode.Conflict, taken.StatusCode);
        }

        await _world.DispatchAllAsync();

        // Um pedido gravado, um aviso. O recusado não deixou linha na outbox.
        Assert.Single(_world.Emails.To(business.OwnerEmail));
    }

    // --- Despacho ---

    [Fact]
    public async Task M11_two_concurrent_dispatchers_deliver_each_email_once_and_never_again()
    {
        string[] recipients = [.. Enumerable.Range(0, 30).Select(_ => $"it-batch-{Guid.NewGuid():N}@exemplo.test")];
        await EnqueueAsync(recipients);

        await Task.WhenAll(_world.DispatchOutboxAsync(), _world.DispatchOutboxAsync());
        await _world.DispatchAllAsync();
        await _world.DispatchAllAsync();

        Assert.All(recipients, r => Assert.Single(_world.Emails.To(r)));

        // Processada, a linha perde o conteúdo (pode haver link com token) e não volta à fila.
        Assert.Equal(30, await CountAsync(
            "SELECT count(*) FROM notifications.outbox WHERE processed_at IS NOT NULL AND payload = '{}'::jsonb AND id = ANY(@ids)",
            ("ids", _world.Emails.Sent.Where(s => recipients.Contains(s.Message.To)).Select(s => s.DeliveryId).ToArray())));
    }

    [Fact]
    public async Task M12_failed_delivery_is_retried_with_growing_delay_until_it_goes_through()
    {
        string recipient = $"it-retry-{Guid.NewGuid():N}@exemplo.test";
        Guid id = (await EnqueueAsync([recipient]))[0];
        _world.Emails.FailNext(recipient, times: 2);

        await _world.DispatchAllAsync();
        Assert.Equal(1L, await CountAsync("SELECT attempts FROM notifications.outbox WHERE id = @id", ("id", id)));
        Assert.Equal(1L, await CountAsync(
            "SELECT count(*) FROM notifications.outbox WHERE id = @id AND next_attempt_at > now() + interval '20 seconds' AND last_error LIKE '%simulada%'",
            ("id", id)));

        // Ainda não venceu: a rodada seguinte não tenta.
        await _world.DispatchAllAsync();
        Assert.Equal(1L, await CountAsync("SELECT attempts FROM notifications.outbox WHERE id = @id", ("id", id)));

        await ExecuteAsync("UPDATE notifications.outbox SET next_attempt_at = now() WHERE id = @id", ("id", id));
        await _world.DispatchAllAsync();
        Assert.Equal(1L, await CountAsync(
            "SELECT count(*) FROM notifications.outbox WHERE id = @id AND attempts = 2 AND next_attempt_at > now() + interval '50 seconds'", ("id", id)));

        await ExecuteAsync("UPDATE notifications.outbox SET next_attempt_at = now() WHERE id = @id", ("id", id));
        await _world.DispatchAllAsync();

        Assert.Single(_world.Emails.To(recipient));
        Assert.Equal(1L, await CountAsync("SELECT count(*) FROM notifications.outbox WHERE id = @id AND processed_at IS NOT NULL", ("id", id)));
    }

    // --- Configuração ---

    [Fact]
    public async Task M13_without_smtp_the_api_does_not_start_outside_development_and_uses_mailpit_in_development()
    {
        await using (var production = new BookingApiFactory(fixture.ConnectionString, "Production", configureEmail: false))
        {
            Exception refused = Assert.ThrowsAny<Exception>(() => production.CreateClient());
            Assert.Contains("Email:Smtp:Host", Flatten(refused));
        }

        await using var development = new BookingApiFactory(fixture.ConnectionString, "Development", configureEmail: false);
        using HttpClient client = development.CreateClient();
        EmailOptions options = development.Services.GetRequiredService<IOptions<EmailOptions>>().Value;

        Assert.Equal("localhost", options.Smtp.Host);
        Assert.Equal(1025, options.Smtp.Port);
    }

    // --- Apoio ---

    private static void AssertIcs(EmailMessage message, Guid appointmentId)
    {
        Assert.NotNull(message.Attachment);
        Assert.EndsWith(".ics", message.Attachment.FileName);
        Assert.StartsWith("text/calendar", message.Attachment.ContentType);
        Assert.Contains("METHOD:REQUEST", message.Attachment.Content);
        Assert.Contains($"UID:appointment-{appointmentId}@booking", message.Attachment.Content);
        Assert.Contains("BEGIN:VALARM", message.Attachment.Content);
        Assert.Contains("TRIGGER:-PT1H", message.Attachment.Content);
    }

    /// <summary>Versão em texto, marca por configuração, nenhuma imagem ou recurso externo.</summary>
    private static void AssertPlainLayout(EmailMessage message)
    {
        Assert.False(string.IsNullOrWhiteSpace(message.TextBody));
        Assert.Contains("Vagoo", message.HtmlBody);
        Assert.DoesNotContain("<img", message.HtmlBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("<link", message.HtmlBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("<script", message.HtmlBody, StringComparison.OrdinalIgnoreCase);
    }

    private async Task<Guid[]> EnqueueAsync(IEnumerable<string> recipients)
    {
        await using AsyncServiceScope scope = fixture.Factory.Services.CreateAsyncScope();
        IEmailOutbox outbox = scope.ServiceProvider.GetRequiredService<IEmailOutbox>();
        foreach (string recipient in recipients)
        {
            outbox.Enqueue(new EmailMessage(recipient, null, "Teste", "Teste", "<p>Teste</p>", "Teste"));
        }

        await scope.ServiceProvider.GetRequiredService<IUnitOfWork>().SaveChangesAsync();

        List<Guid> ids = [];
        foreach (string recipient in recipients)
        {
            ids.Add(await ScalarAsync<Guid>("SELECT id FROM notifications.outbox WHERE payload->>'to' = @to", ("to", recipient)));
        }

        return [.. ids];
    }

    private static string Flatten(Exception e) => e.InnerException is null ? e.Message : $"{e.Message} {Flatten(e.InnerException)}";

    private static string TokenIn(string body) => Uri.UnescapeDataString(TokenPattern().Match(body).Groups[1].Value);

    [GeneratedRegex(@"token=([^\s&]+)")]
    private static partial Regex TokenPattern();

    private Task<long> CountAsync(string sql, params (string Name, object Value)[] parameters) => _world.CountAsync(sql, parameters);

    private async Task<T> ScalarAsync<T>(string sql, params (string Name, object Value)[] parameters)
    {
        await using var connection = new NpgsqlConnection(fixture.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        foreach ((string name, object value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        return (T)(await command.ExecuteScalarAsync())!;
    }

    private async Task ExecuteAsync(string sql, params (string Name, object Value)[] parameters)
    {
        await using var connection = new NpgsqlConnection(fixture.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        foreach ((string name, object value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        await command.ExecuteNonQueryAsync();
    }
}
