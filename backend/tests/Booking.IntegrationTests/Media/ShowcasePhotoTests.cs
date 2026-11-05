using System.Net.Http.Headers;
using System.Net.Http.Json;
using Booking.Arguments.Module.Catalog;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Media;

/// <summary>"Mostrar foto na vitrine": desligada, nenhuma resposta pública leva a imagem; o dono continua vendo.</summary>
[Collection(IntegrationCollection.Name)]
public sealed class ShowcasePhotoTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private async Task UploadAsync(TestBusiness business, Guid serviceId)
    {
        using HttpRequestMessage request = TestWorld.Build(HttpMethod.Put, $"/api/businesses/current/services/{serviceId}/image", null, business.OwnerToken);
        var file = new ByteArrayContent(TestImages.Jpeg(300, 300));
        file.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        request.Content = new MultipartFormDataContent { { file, "file", "foto.jpg" } };
        using HttpResponseMessage response = await _world.Client.SendAsync(request);
        await TestWorld.EnsureStatusAsync(response, System.Net.HttpStatusCode.OK);
    }

    private async Task<string> PublicBodyAsync(string path)
    {
        using HttpResponseMessage response = await _world.SendAsync(HttpMethod.Get, path, null, null);
        return await response.Content.ReadAsStringAsync();
    }

    [Fact]
    public async Task S1_a_photo_turned_off_leaves_no_trace_in_public_responses()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30, Name: "Corte com foto")]);
        Guid serviceId = business.Services[0].Id;
        await UploadAsync(business, serviceId);

        string services = $"/api/businesses/{business.Id}/services";
        string professional = $"/api/professionals/{business.ProfessionalIds[0]}";

        // Ligada, o padrão: a imagem sai nas duas vitrines.
        Assert.Contains("/media/", await PublicBodyAsync(services));
        Assert.Contains("/media/", await PublicBodyAsync(professional));

        await _world.SendOkAsync(
            HttpMethod.Put, $"/api/businesses/current/services/{serviceId}",
            new SaveServiceRequest("Corte com foto", null, 30, 0, 0, 15, 5000, null, ShowPhotoInShowcase: false), business.OwnerToken);

        Assert.DoesNotContain("/media/", await PublicBodyAsync(services));
        Assert.DoesNotContain("/media/", await PublicBodyAsync(professional));

        // O dono continua vendo a foto no painel, para poder religar.
        PagedResult<ServiceResponse> mine = await _world.SendOkAsync<PagedResult<ServiceResponse>>(
            HttpMethod.Get, "/api/businesses/current/services", null, business.OwnerToken);
        ServiceResponse service = Assert.Single(mine.Items);
        Assert.NotNull(service.Photo);
        Assert.False(service.ShowPhotoInShowcase);
    }

    [Fact]
    public async Task S2_the_column_defaults_to_on_in_a_database_migrated_from_empty()
    {
        // A suíte inteira roda sobre um banco vazio migrado do zero (IntegrationFixture): esta é a prova da migration.
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);

        PagedResult<ServiceResponse> mine = await _world.SendOkAsync<PagedResult<ServiceResponse>>(
            HttpMethod.Get, "/api/businesses/current/services", null, business.OwnerToken);

        Assert.True(Assert.Single(mine.Items).ShowPhotoInShowcase);
    }
}
