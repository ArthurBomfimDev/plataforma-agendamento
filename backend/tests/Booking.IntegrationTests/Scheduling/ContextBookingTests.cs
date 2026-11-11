using System.Net;
using Booking.Arguments.Module.Identity;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Scheduling;

/// <summary>
/// Conta única com troca de contexto (decisão de 22/09, §2.0): o dono também pode ser consumidor, mas agenda só no
/// contexto de consumidor e nunca no próprio estabelecimento.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class ContextBookingTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    [Fact]
    public async Task Q1_business_context_token_cannot_book_as_customer()
    {
        TestBusiness own = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestBusiness other = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        await _world.AddCustomerProfileAsync(own.OwnerUserId);
        var ownerInPanel = new TestUser(own.OwnerUserId, null, own.OwnerToken);

        using HttpResponseMessage response = await _world.Client.SendAsync(
            _world.RequestAppointment(ownerInPanel, other, other.Services[0], other.ProfessionalIds[0], TestCalendar.At(10)));

        await TestWorld.EnsureStatusAsync(response, HttpStatusCode.Forbidden);
        Assert.Equal("appointment.customer_context_required", await TestWorld.ErrorCodeAsync(response));
    }

    [Fact]
    public async Task Q2_owner_cannot_book_the_own_business_and_still_books_elsewhere()
    {
        TestBusiness own = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestBusiness other = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        await _world.AddCustomerProfileAsync(own.OwnerUserId);
        ContextTokenResponse consumer = await _world.SendOkAsync<ContextTokenResponse>(
            HttpMethod.Post, "/api/users/me/context", new SwitchContextRequest(null), own.OwnerToken);
        var ownerAsCustomer = new TestUser(own.OwnerUserId, null, consumer.AccessToken);

        using HttpResponseMessage self = await _world.Client.SendAsync(
            _world.RequestAppointment(ownerAsCustomer, own, own.Services[0], own.ProfessionalIds[0], TestCalendar.At(10)));
        using HttpResponseMessage elsewhere = await _world.Client.SendAsync(
            _world.RequestAppointment(ownerAsCustomer, other, other.Services[0], other.ProfessionalIds[0], TestCalendar.At(10)));

        await TestWorld.EnsureStatusAsync(self, HttpStatusCode.Conflict);
        Assert.Equal("appointment.cannot_book_own_business", await TestWorld.ErrorCodeAsync(self));
        await TestWorld.EnsureStatusAsync(elsewhere, HttpStatusCode.Created);
    }

    [Fact]
    public async Task Q3_me_lists_the_contexts_the_account_can_open()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestUser staff = await _world.NewStaffAsync(business, 0);
        TestUser customer = await _world.NewCustomerAsync();

        CurrentUserResponse owner = await _world.SendOkAsync<CurrentUserResponse>(HttpMethod.Get, "/api/users/me", null, business.OwnerToken);
        CurrentUserResponse professional = await _world.SendOkAsync<CurrentUserResponse>(HttpMethod.Get, "/api/users/me", null, staff.Token);
        CurrentUserResponse consumer = await _world.SendOkAsync<CurrentUserResponse>(HttpMethod.Get, "/api/users/me", null, customer.Token);

        Assert.False(owner.HasCustomerProfile);
        Assert.Equal(new UserBusinessResponse(business.Id, business.Name, "Owner"), Assert.Single(owner.Businesses));
        Assert.Equal("Professional", Assert.Single(professional.Businesses).Role);
        Assert.True(consumer.HasCustomerProfile);
        Assert.Empty(consumer.Businesses);

        await _world.AddCustomerProfileAsync(business.OwnerUserId);
        CurrentUserResponse both = await _world.SendOkAsync<CurrentUserResponse>(HttpMethod.Get, "/api/users/me", null, business.OwnerToken);
        Assert.True(both.HasCustomerProfile);
        Assert.Single(both.Businesses);
    }
}
