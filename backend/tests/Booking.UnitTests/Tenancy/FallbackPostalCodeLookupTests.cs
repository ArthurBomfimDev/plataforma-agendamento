using Booking.Application.Module.Tenancy.Geo;
using Booking.Domain.Exceptions;
using Booking.Infrastructure.Module.Tenancy.Geo;

namespace Booking.UnitTests.Tenancy;

/// <summary>O provedor de reserva do CEP: quando consulta, e o que diz quando os dois falham.</summary>
public sealed class FallbackPostalCodeLookupTests
{
    private static readonly PostalCodeAddress _address = new("17471318", "Avenida Doutor Gil Borges", "Centro", "Duartina", "SP");

    private sealed class Stub(Func<PostalCodeAddress?> answer) : IPostalCodeLookup
    {
        public int Calls { get; private set; }

        public Task<PostalCodeAddress?> LookupAsync(string postalCode, CancellationToken ct = default)
        {
            Calls++;
            return Task.FromResult(answer());
        }
    }

    private static Stub Found() => new(() => _address);

    private static Stub NotFound() => new(() => null);

    private static Stub Down() => new(() => throw new DomainException("geo.provider_unavailable"));

    [Fact]
    public async Task The_primary_answer_is_used_and_the_secondary_is_not_asked()
    {
        Stub secondary = Found();

        PostalCodeAddress? result = await new FallbackPostalCodeLookup(Found(), secondary).LookupAsync("17471318");

        Assert.Equal(_address, result);
        Assert.Equal(0, secondary.Calls);
    }

    [Fact]
    public async Task A_code_the_primary_does_not_know_is_looked_up_in_the_secondary()
    {
        PostalCodeAddress? result = await new FallbackPostalCodeLookup(NotFound(), Found()).LookupAsync("17471318");

        Assert.Equal(_address, result);
    }

    [Fact]
    public async Task A_primary_that_is_down_falls_back_to_the_secondary()
    {
        PostalCodeAddress? result = await new FallbackPostalCodeLookup(Down(), Found()).LookupAsync("17471318");

        Assert.Equal(_address, result);
    }

    [Fact]
    public async Task When_both_say_the_code_does_not_exist_the_answer_is_null()
    {
        Assert.Null(await new FallbackPostalCodeLookup(NotFound(), NotFound()).LookupAsync("00000000"));
    }

    [Fact]
    public async Task When_both_are_down_it_is_unavailable_and_never_says_the_code_does_not_exist()
    {
        DomainException e = await Assert.ThrowsAsync<DomainException>(
            () => new FallbackPostalCodeLookup(Down(), Down()).LookupAsync("17471318"));

        Assert.Equal("geo.provider_unavailable", e.Code);
    }

    [Fact]
    public async Task When_the_primary_does_not_know_and_the_secondary_is_down_the_code_does_not_exist()
    {
        Assert.Null(await new FallbackPostalCodeLookup(NotFound(), Down()).LookupAsync("00000000"));
    }

    [Fact]
    public async Task When_the_primary_is_down_and_the_secondary_does_not_know_the_code_does_not_exist()
    {
        Assert.Null(await new FallbackPostalCodeLookup(Down(), NotFound()).LookupAsync("00000000"));
    }

    [Fact]
    public void The_base_url_override_belongs_to_the_primary_provider_only()
    {
        var options = new PostalCodeOptions { Provider = PostalCodeOptions.BrasilApi, BaseUrl = "https://espelho.example/" };

        Assert.Equal("https://espelho.example/", options.UrlFor(PostalCodeOptions.BrasilApi));
        Assert.Equal("https://viacep.com.br/", options.UrlFor(PostalCodeOptions.ViaCep));
        Assert.Equal(PostalCodeOptions.ViaCep, options.FallbackProvider);
    }
}
