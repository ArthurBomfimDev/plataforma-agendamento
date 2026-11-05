using System.Net;
using Booking.Arguments.Module.Identity;
using Booking.Arguments.Module.Tenancy;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Tenancy;

/// <summary>
/// Versão B da regra de cadastro (ADR-028): toda categoria aceita CPF ou CNPJ, o tipo é conferido com o documento, MEI só
/// com CNPJ, e o documento nunca sai numa resposta pública. Cada teste usa a própria API: criar tem limite por conta.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class DocumentRuleTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private async Task<HttpResponseMessage> RegisterAsync(string document, string category, string? type, bool isMei = false)
    {
        TestUser owner = await _world.NewUserAsync("Dono da regra");
        return await _world.SendAsync(
            HttpMethod.Post, "/api/businesses",
            new RegisterBusinessRequest($"Regra {Guid.NewGuid():N}"[..30], document, category, type, isMei), owner.Token);
    }

    [Theory]
    [InlineData("Beleza")]
    [InlineData("Saude")]
    public async Task D1_every_category_accepts_cpf_and_cnpj(string category)
    {
        using HttpResponseMessage cpf = await RegisterAsync(Cpf.Random(), category, "Cpf");
        using HttpResponseMessage cnpj = await RegisterAsync(Cnpj.Random(), category, "Cnpj");
        using HttpResponseMessage mei = await RegisterAsync(Cnpj.Random(), category, "Cnpj", isMei: true);

        Assert.Equal(HttpStatusCode.Created, cpf.StatusCode);
        Assert.Equal(HttpStatusCode.Created, cnpj.StatusCode);
        Assert.Equal(HttpStatusCode.Created, mei.StatusCode);
    }

    [Theory]
    [InlineData("Beleza")]
    [InlineData("Saude")]
    public async Task D2_the_document_must_match_the_declared_type_and_the_check_digit(string category)
    {
        (string Document, string Type, string Code)[] cases =
        [
            (Cnpj.Random(), "Cpf", "document.expected_cpf"),
            (Cpf.Random(), "Cnpj", "document.expected_cnpj"),
            ("52998224726", "Cpf", "document.invalid_check_digit"),
            ("11222333000180", "Cnpj", "document.invalid_check_digit"),
            ("123", "Cpf", "document.invalid_length"),
            (Cpf.Random(), "Rg", "document.type_invalid"),
        ];

        foreach ((string document, string type, string code) in cases)
        {
            using HttpResponseMessage refused = await RegisterAsync(document, category, type);

            Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
            Assert.Equal(code, await TestWorld.ErrorCodeAsync(refused));
        }
    }

    [Fact]
    public async Task D3_mei_only_with_cnpj()
    {
        using HttpResponseMessage refused = await RegisterAsync(Cpf.Random(), "Beleza", "Cpf", isMei: true);

        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        Assert.Equal("business.mei_requires_cnpj", await TestWorld.ErrorCodeAsync(refused));
    }

    [Fact]
    public async Task D4_only_the_owner_sees_the_document_and_no_public_response_carries_it()
    {
        string document = Cpf.Random();
        TestUser owner = await _world.NewUserAsync("Autônoma");
        BusinessResponse created = await _world.SendOkAsync<BusinessResponse>(
            HttpMethod.Post, "/api/businesses", new RegisterBusinessRequest("Autônoma da Vila", document, "Beleza", "Cpf"), owner.Token);
        ContextTokenResponse context = await _world.SendOkAsync<ContextTokenResponse>(
            HttpMethod.Post, "/api/users/me/context", new SwitchContextRequest(created.Id), owner.Token);

        BusinessDetailResponse mine = await _world.SendOkAsync<BusinessDetailResponse>(HttpMethod.Get, "/api/businesses/current", null, context.AccessToken);
        Assert.Equal(document, mine.Document);
        Assert.Equal("Cpf", mine.DocumentType);
        Assert.False(mine.IsMei);

        TestBusiness active = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        string activeDocument = (await _world.SendOkAsync<BusinessDetailResponse>(HttpMethod.Get, "/api/businesses/current", null, active.OwnerToken)).Document;

        foreach (string path in new[] { $"/api/businesses/{active.Id}", $"/api/businesses/{active.Id}/services", $"/api/businesses/{active.Id}/professionals" })
        {
            using HttpResponseMessage response = await _world.SendAsync(HttpMethod.Get, path, null, null);
            string body = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.DoesNotContain(activeDocument, body);
            Assert.DoesNotContain("documentType", body);
            Assert.DoesNotContain("isMei", body);
        }
    }
}
