using System.Net;
using System.Text.RegularExpressions;
using Booking.Arguments.Module.People;
using Booking.Arguments.Module.Scheduling;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Tenancy;

/// <summary>
/// Rodada 2 do teste de 05/11: o atendente opera a agenda de todos sem ser profissional, a seção Equipe mostra os papéis e
/// só o convite cria registro de profissional.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed partial class TeamRolesTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    [GeneratedRegex(@"convite\?token=([^\s""&<]+)")]
    private static partial Regex TokenInLink();

    [Fact]
    public async Task R1_the_attendant_sees_the_appointments_of_every_professional()
    {
        TestBusiness business = await _world.NewBusinessAsync(2, [new ServiceSpec(60)]);
        TestUser attendant = await _world.NewAttendantAsync(business);
        IReadOnlyList<TestUser> customers = await _world.NewCustomersAsync(2);

        AppointmentResponse first = await _world.BookAsync(customers[0], business, business.Services[0], business.ProfessionalIds[0], TestCalendar.At(10));
        AppointmentResponse second = await _world.BookAsync(customers[1], business, business.Services[0], business.ProfessionalIds[1], TestCalendar.At(11));

        PagedResult<AppointmentResponse> agenda = await _world.SendOkAsync<PagedResult<AppointmentResponse>>(
            HttpMethod.Get, $"/api/businesses/current/appointments?date={TestCalendar.BookableDay:yyyy-MM-dd}", null, attendant.Token);

        Assert.Contains(agenda.Items, x => x.Id == first.Id);
        Assert.Contains(agenda.Items, x => x.Id == second.Id);
    }

    [Fact]
    public async Task R2_the_attendant_is_not_in_professionals_nor_in_the_public_list()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser attendant = await _world.NewAttendantAsync(business);

        PagedResult<ProfessionalResponse> panel = await _world.SendOkAsync<PagedResult<ProfessionalResponse>>(
            HttpMethod.Get, "/api/businesses/current/professionals", null, business.OwnerToken);
        using HttpResponseMessage publicList = await _world.SendAsync(HttpMethod.Get, $"/api/businesses/{business.Id}/professionals", null, null);
        string body = await publicList.Content.ReadAsStringAsync();

        Assert.Single(panel.Items);
        Assert.DoesNotContain("Atendente de teste", body);
        Assert.DoesNotContain(panel.Items, x => x.DisplayName == "Atendente de teste");

        // Na seção Equipe ele aparece, com o papel.
        PagedResult<TeamMemberResponse> members = await _world.SendOkAsync<PagedResult<TeamMemberResponse>>(
            HttpMethod.Get, "/api/businesses/current/members", null, business.OwnerToken);
        Assert.Contains(members.Items, x => x.Role == "Attendant" && x.Name == "Atendente de teste");
        Assert.Contains(members.Items, x => x.Role == "Owner");

        using HttpResponseMessage refused = await _world.SendAsync(HttpMethod.Get, "/api/businesses/current/members", null, attendant.Token);
        Assert.Equal(HttpStatusCode.Forbidden, refused.StatusCode);
    }

    [Fact]
    public async Task R3_only_the_acceptance_of_a_professional_invitation_creates_a_professional_record()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);

        async Task<int> CountAsync() => (await _world.SendOkAsync<PagedResult<ProfessionalResponse>>(
            HttpMethod.Get, "/api/businesses/current/professionals", null, business.OwnerToken)).Items.Count;

        foreach ((string role, int expected) in new[] { ("Attendant", 1), ("Professional", 2) })
        {
            string email = $"convite.{Guid.NewGuid():N}@example.com";
            await _world.SendOkAsync<InvitationResponse>(
                HttpMethod.Post, "/api/businesses/current/invitations", new InviteMemberRequest("Pessoa Convidada", email, role), business.OwnerToken);
            await _world.DispatchAllAsync();

            // O convite sozinho não cria nada.
            Assert.Equal(expected - (role == "Professional" ? 1 : 0), await CountAsync());

            string token = Uri.UnescapeDataString(TokenInLink().Match(_world.Emails.To(email).Last().TextBody).Groups[1].Value);
            await _world.SendOkAsync<AcceptedInvitationResponse>(
                HttpMethod.Post, "/api/invitations/accept-new-account",
                new AcceptInvitationNewAccountRequest(token, "Pessoa Convidada", "senha-de-teste-123", AcceptTerms: true), null!);

            Assert.Equal(expected, await CountAsync());
        }
    }

    [Fact]
    public async Task R4_the_owner_cannot_create_someone_else_directly_but_can_create_the_own_profile()
    {
        TestBusiness business = await _world.NewBusinessAsync(0, [new ServiceSpec(60)], submit: false);

        using HttpResponseMessage refused = await _world.SendAsync(
            HttpMethod.Post, "/api/businesses/current/professionals", new CreateProfessionalRequest("Outra Pessoa", null, null, IsMe: false), business.OwnerToken);
        Assert.Equal(HttpStatusCode.Conflict, refused.StatusCode);
        Assert.Equal("professional.cannot_create_without_invitation", await TestWorld.ErrorCodeAsync(refused));

        ProfessionalResponse own = await _world.SendOkAsync<ProfessionalResponse>(
            HttpMethod.Post, "/api/businesses/current/professionals", new CreateProfessionalRequest("Dona", null, null, IsMe: true), business.OwnerToken);
        Assert.NotNull(own.MembershipId);
    }
}
