using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using Booking.Application.Contracts.Notifications;
using Booking.Arguments.Module.Compliance;
using Booking.Arguments.Module.Identity;
using Booking.Arguments.Module.Reputation;
using Booking.Arguments.Module.Scheduling;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;
using Npgsql;

namespace Booking.IntegrationTests.Reputation;

/// <summary>
/// Avaliações contra o banco de verdade (ADR-032): o que o teste unitário não enxerga, como o índice de uma avaliação por
/// agendamento, o resumo sob concorrência (<c>xmin</c>), as rotas públicas e a busca por nota.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class ReviewTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

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

    /// <summary>A API só conclui depois do horário, e o teste só agenda no futuro: a conclusão entra direto no banco.</summary>
    private async Task<AppointmentResponse> CompletedAsync(TestUser customer, TestBusiness business, int hour = 10)
    {
        AppointmentResponse appointment = await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(hour));
        await ExecuteAsync("UPDATE scheduling.appointment SET status = 'Completed', completed_at = now() WHERE id = @id", ("id", appointment.Id));
        return appointment;
    }

    private Task<HttpResponseMessage> ReviewAsync(TestUser customer, Guid appointmentId, int rating, int? professional = null, string? comment = null) =>
        _world.SendAsync(HttpMethod.Post, $"/api/appointments/{appointmentId}/review", new SaveReviewRequest(rating, professional, comment), customer.Token);

    private async Task<RatingSummaryResponse> RatingAsync(Guid businessId) =>
        (await _world.Client.GetFromJsonAsync<RatingSummaryResponse>($"/api/businesses/{businessId}/rating", TestWorld.Json))!;

    [Fact]
    public async Task V1_review_appears_in_public_with_the_abbreviated_name_and_the_same_appointment_cannot_be_reviewed_twice()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60, Name: "Corte de teste")]);
        TestUser customer = await _world.NewCustomerAsync("Ana Souza Lima", null);
        AppointmentResponse appointment = await CompletedAsync(customer, business);

        using (HttpResponseMessage created = await ReviewAsync(customer, appointment.Id, 5, 4, "Muito bom."))
        {
            Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        }

        using (HttpResponseMessage again = await ReviewAsync(customer, appointment.Id, 1))
        {
            Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
            Assert.Equal("review.already_reviewed", await TestWorld.ErrorCodeAsync(again));
        }

        PagedResult<PublicReviewResponse> list = (await _world.Client.GetFromJsonAsync<PagedResult<PublicReviewResponse>>(
            $"/api/businesses/{business.Id}/reviews", TestWorld.Json))!;
        PublicReviewResponse review = Assert.Single(list.Items);
        Assert.Equal("Ana S.", review.ReviewerName);
        Assert.Equal("Corte de teste", review.ServiceName);
        Assert.Equal("Muito bom.", review.Comment);

        RatingSummaryResponse rating = await RatingAsync(business.Id);
        Assert.Equal(1, rating.Count);
        Assert.Null(rating.Average);
        Assert.True(rating.IsNew);

        RatingSummaryResponse professional = (await _world.Client.GetFromJsonAsync<RatingSummaryResponse>(
            $"/api/professionals/{business.ProfessionalIds[0]}/rating", TestWorld.Json))!;
        Assert.Equal(1, professional.Count);
    }

    [Fact]
    public async Task V2_only_the_customer_of_a_completed_appointment_reviews_and_never_from_the_panel()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser customer = await _world.NewCustomerAsync();
        TestUser stranger = await _world.NewCustomerAsync();

        AppointmentResponse pending = await _world.BookAsync(customer, business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(9));
        using (HttpResponseMessage notCompleted = await ReviewAsync(customer, pending.Id, 5))
        {
            Assert.Equal(HttpStatusCode.Conflict, notCompleted.StatusCode);
            Assert.Equal("review.not_completed", await TestWorld.ErrorCodeAsync(notCompleted));
        }

        AppointmentResponse appointment = await CompletedAsync(customer, business);

        using (HttpResponseMessage notMine = await ReviewAsync(stranger, appointment.Id, 5))
        {
            Assert.Equal(HttpStatusCode.NotFound, notMine.StatusCode);
        }

        using HttpResponseMessage panel = await _world.SendAsync(
            HttpMethod.Post, $"/api/appointments/{appointment.Id}/review", new SaveReviewRequest(5, null, null), business.OwnerToken);
        Assert.Equal(HttpStatusCode.Forbidden, panel.StatusCode);
        Assert.Equal("appointment.customer_context_required", await TestWorld.ErrorCodeAsync(panel));
    }

    [Fact]
    public async Task V3_the_owner_with_a_consumer_token_cannot_review_the_own_business()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser customer = await _world.NewCustomerAsync();
        AppointmentResponse appointment = await CompletedAsync(customer, business);

        // Um atendimento do próprio dono, em contexto de consumidor: o vínculo com o estabelecimento é que recusa.
        Guid ownerCustomer = await _world.AddCustomerProfileAsync(business.OwnerUserId);
        await ExecuteAsync("UPDATE scheduling.appointment SET customer_id = @c WHERE id = @id", ("c", ownerCustomer), ("id", appointment.Id));
        ContextTokenResponse consumer = await _world.SendOkAsync<ContextTokenResponse>(
            HttpMethod.Post, "/api/users/me/context", new SwitchContextRequest(null), business.OwnerToken);

        using HttpResponseMessage refused = await _world.SendAsync(
            HttpMethod.Post, $"/api/appointments/{appointment.Id}/review", new SaveReviewRequest(5, null, null), consumer.AccessToken);

        Assert.Equal(HttpStatusCode.Forbidden, refused.StatusCode);
        Assert.Equal("review.not_allowed", await TestWorld.ErrorCodeAsync(refused));
    }

    [Fact]
    public async Task V4_two_simultaneous_reviews_of_one_appointment_leave_exactly_one()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser customer = await _world.NewCustomerAsync();
        AppointmentResponse appointment = await CompletedAsync(customer, business);

        HttpResponseMessage[] responses = await Task.WhenAll(Enumerable.Range(0, 6).Select(_ => ReviewAsync(customer, appointment.Id, 5)));

        Assert.Equal(1, responses.Count(r => r.StatusCode == HttpStatusCode.Created));
        Assert.All(responses, r => Assert.True(
            r.StatusCode is HttpStatusCode.Created or HttpStatusCode.Conflict or HttpStatusCode.ServiceUnavailable, $"veio {(int)r.StatusCode}"));
        Assert.Equal(1, (await RatingAsync(business.Id)).Count);
    }

    [Fact]
    public async Task V5_simultaneous_reviews_of_one_business_never_lose_a_count()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(12);
        var appointments = new List<(TestUser Customer, Guid Id)>();

        for (int i = 0; i < customers.Count; i++)
        {
            appointments.Add((customers[i], (await CompletedAsync(customers[i], business, hour: 8 + i)).Id));
        }

        // Quem perde a disputa recebe 503 e tenta de novo, como o aviso da API pede. Nada pode virar 500 nem sumir.
        async Task SaveAsync(TestUser customer, Guid id)
        {
            for (int attempt = 0; attempt < 30; attempt++)
            {
                using HttpResponseMessage response = await ReviewAsync(customer, id, 4);
                if (response.StatusCode == HttpStatusCode.Created)
                {
                    return;
                }

                Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
                Assert.Equal("review.contention_try_again", await TestWorld.ErrorCodeAsync(response));
            }

            Assert.Fail("A disputa não terminou em 30 tentativas.");
        }

        await Task.WhenAll(appointments.Select(a => SaveAsync(a.Customer, a.Id)));

        RatingSummaryResponse rating = await RatingAsync(business.Id);
        Assert.Equal(12, rating.Count);
        Assert.Equal(4.0, rating.Average);
        Assert.Equal([0, 0, 0, 12, 0], rating.Distribution);
    }

    [Fact]
    public async Task V6_edit_moves_the_average_once_and_a_second_edit_is_refused()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser customer = await _world.NewCustomerAsync();
        AppointmentResponse appointment = await CompletedAsync(customer, business);
        (await ReviewAsync(customer, appointment.Id, 5)).Dispose();

        MyReviewResponse edited = await _world.SendOkAsync<MyReviewResponse>(
            HttpMethod.Put, $"/api/appointments/{appointment.Id}/review", new SaveReviewRequest(2, null, "mudei"), customer.Token);
        Assert.False(edited.CanEdit);
        Assert.Equal([0, 1, 0, 0, 0], (await RatingAsync(business.Id)).Distribution);

        using HttpResponseMessage again = await _world.SendAsync(
            HttpMethod.Put, $"/api/appointments/{appointment.Id}/review", new SaveReviewRequest(3, null, null), customer.Token);
        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        Assert.Equal("review.already_edited", await TestWorld.ErrorCodeAsync(again));
    }

    [Fact]
    public async Task V7_health_review_keeps_no_service_and_the_invite_names_nothing()
    {
        TestBusiness clinic = await _world.NewBusinessAsync(1, [new ServiceSpec(60, Name: "Fisioterapia respiratória")], category: "Saude");
        TestUser customer = await _world.NewCustomerAsync();
        ConsentVersionsResponse versions = await _world.SendOkAsync<ConsentVersionsResponse>(HttpMethod.Get, "/api/consents/versions", null, customer.Token);
        await _world.SendOkAsync(HttpMethod.Post, "/api/consents", new GrantConsentRequest("SensitiveScheduling", versions.SensitiveScheduling), customer.Token);

        AppointmentResponse appointment = await _world.BookAsync(customer, clinic, clinic.Services[0], clinic.ProfessionalIds[0], TestCalendar.At(10));
        await _world.SendOkAsync(HttpMethod.Post, $"/api/businesses/current/appointments/{appointment.Id}/confirm", null, clinic.OwnerToken);

        // Conclusão pela rota de verdade: o horário vai para o passado, e o dono conclui.
        await ExecuteAsync(
            """
            UPDATE scheduling.appointment
            SET starts_at = now() - interval '3 hours', ends_at = now() - interval '2 hours',
                blocked_starts_at = now() - interval '3 hours', blocked_ends_at = now() - interval '2 hours'
            WHERE id = @id
            """,
            ("id", appointment.Id));
        await _world.SendOkAsync(HttpMethod.Post, $"/api/businesses/current/appointments/{appointment.Id}/complete", null, clinic.OwnerToken);
        await _world.DispatchAllAsync();

        EmailMessage invite = Assert.Single(_world.Emails.To(customer.Email), m => m.Subject == "Como foi o seu atendimento?");
        foreach (string text in new[] { invite.Preheader, invite.HtmlBody, invite.TextBody })
        {
            Assert.DoesNotContain("Fisioterapia", text);
            Assert.DoesNotContain(clinic.Name, text);
        }

        using (HttpResponseMessage created = await ReviewAsync(customer, appointment.Id, 5))
        {
            Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        }

        PagedResult<PublicReviewResponse> list = (await _world.Client.GetFromJsonAsync<PagedResult<PublicReviewResponse>>(
            $"/api/businesses/{clinic.Id}/reviews", TestWorld.Json))!;
        Assert.Null(Assert.Single(list.Items).ServiceName);
    }

    [Fact]
    public async Task V9_owner_reports_admin_hides_and_the_average_follows_then_unhide_restores_it()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestBusiness other = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser admin = await _world.NewAdminAsync();
        TestUser attendant = await _world.NewAttendantAsync(business);
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(2);

        for (int i = 0; i < 2; i++)
        {
            AppointmentResponse appointment = await CompletedAsync(customers[i], business, hour: 9 + i);
            (await ReviewAsync(customers[i], appointment.Id, i == 0 ? 5 : 1, comment: i == 0 ? null : "Ofensa")).Dispose();
        }

        PagedResult<OwnerReviewResponse> mine = await _world.SendOkAsync<PagedResult<OwnerReviewResponse>>(
            HttpMethod.Get, "/api/businesses/current/reviews", null, business.OwnerToken);
        OwnerReviewResponse target = Assert.Single(mine.Items, r => r.Comment == "Ofensa");
        Assert.False(target.Reported);

        string reportPath = $"/api/businesses/current/reviews/{target.Id}/report";
        var report = new ReportReviewRequest("Comentário ofensivo.");

        // Só o dono, e só o do estabelecimento.
        using (HttpResponseMessage byAttendant = await _world.SendAsync(HttpMethod.Post, reportPath, report, attendant.Token))
        {
            Assert.Equal(HttpStatusCode.Forbidden, byAttendant.StatusCode);
        }

        using (HttpResponseMessage crossTenant = await _world.SendAsync(HttpMethod.Post, reportPath, report, other.OwnerToken))
        {
            Assert.Equal(HttpStatusCode.NotFound, crossTenant.StatusCode);
        }

        using (HttpResponseMessage reported = await _world.SendAsync(HttpMethod.Post, reportPath, report, business.OwnerToken))
        {
            Assert.Equal(HttpStatusCode.NoContent, reported.StatusCode);
        }

        using (HttpResponseMessage again = await _world.SendAsync(HttpMethod.Post, reportPath, report, business.OwnerToken))
        {
            Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
        }

        // A denúncia não tira nada do ar.
        Assert.Equal(2, (await RatingAsync(business.Id)).Count);

        using (HttpResponseMessage notAdmin = await _world.SendAsync(HttpMethod.Get, "/api/admin/reviews", null, business.OwnerToken))
        {
            Assert.Equal(HttpStatusCode.Forbidden, notAdmin.StatusCode);
        }

        PagedResult<ModerationReviewResponse> queue = await _world.SendOkAsync<PagedResult<ModerationReviewResponse>>(
            HttpMethod.Get, "/api/admin/reviews?pageSize=100", null, admin.Token);
        ModerationReviewResponse item = Assert.Single(queue.Items, r => r.Id == target.Id);
        Assert.Equal(business.Name, item.BusinessName);
        Assert.Equal("Comentário ofensivo.", item.ReportReason);

        using (HttpResponseMessage noReason = await _world.SendAsync(HttpMethod.Post, $"/api/admin/reviews/{target.Id}/hide", new HideReviewRequest(" "), admin.Token))
        {
            Assert.Equal(HttpStatusCode.BadRequest, noReason.StatusCode);
        }

        ModerationReviewResponse hidden = await _world.SendOkAsync<ModerationReviewResponse>(
            HttpMethod.Post, $"/api/admin/reviews/{target.Id}/hide", new HideReviewRequest("Ofensa"), admin.Token);
        Assert.True(hidden.IsHidden);
        Assert.Equal(admin.UserId, hidden.HiddenByUserId);
        Assert.False(hidden.ReportOpen);

        RatingSummaryResponse afterHide = await RatingAsync(business.Id);
        Assert.Equal(1, afterHide.Count);
        Assert.Equal([0, 0, 0, 0, 1], afterHide.Distribution);
        PagedResult<PublicReviewResponse> list = (await _world.Client.GetFromJsonAsync<PagedResult<PublicReviewResponse>>(
            $"/api/businesses/{business.Id}/reviews", TestWorld.Json))!;
        Assert.DoesNotContain(list.Items, r => r.Id == target.Id);

        await _world.SendOkAsync(HttpMethod.Post, $"/api/admin/reviews/{target.Id}/unhide", null, admin.Token);
        Assert.Equal(2, (await RatingAsync(business.Id)).Count);
    }

    [Fact]
    public async Task V8_search_sorts_by_rating_filters_by_minimum_and_keeps_the_new_ones_after()
    {
        TestLocation here = TestLocation.Isolated();
        TestBusiness fresh = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], location: here);
        TestBusiness rated = await _world.NewBusinessAsync(1, [new ServiceSpec(60)], location: here.North(800));
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(3);

        for (int i = 0; i < 3; i++)
        {
            AppointmentResponse appointment = await CompletedAsync(customers[i], rated, hour: 9 + i);
            (await ReviewAsync(customers[i], appointment.Id, 5)).Dispose();
        }

        async Task<PagedResult<BusinessSearchItemResponse>> SearchAsync(string extra) =>
            (await _world.Client.GetFromJsonAsync<PagedResult<BusinessSearchItemResponse>>(
                string.Create(CultureInfo.InvariantCulture, $"/api/businesses/search?latitude={here.Latitude}&longitude={here.Longitude}&radiusKm=2{extra}"),
                TestWorld.Json))!;

        PagedResult<BusinessSearchItemResponse> byDistance = await SearchAsync(string.Empty);
        Assert.Equal([fresh.Id, rated.Id], byDistance.Items.Select(i => i.Id));

        PagedResult<BusinessSearchItemResponse> byRating = await SearchAsync("&sortBy=rating");
        Assert.Equal([rated.Id, fresh.Id], byRating.Items.Select(i => i.Id));
        Assert.Equal(5.0, byRating.Items[0].RatingAverage);
        Assert.Equal(3, byRating.Items[0].RatingCount);
        Assert.Null(byRating.Items[1].RatingAverage);

        BusinessSearchItemResponse only = Assert.Single((await SearchAsync("&minRating=4")).Items);
        Assert.Equal(rated.Id, only.Id);
    }
}
