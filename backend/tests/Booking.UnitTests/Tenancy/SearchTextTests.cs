using Booking.Application.Common.Search;

namespace Booking.UnitTests.Tenancy;

/// <summary>Texto da busca (ADR-024): sem acento, sem caixa, sinônimos do dicionário.</summary>
public sealed class SearchTextTests
{
    [Theory]
    [InlineData("Coloração", "COLORACAO")]
    [InlineData("  são   paulo ", "SAO PAULO")]
    [InlineData("CABÊLO", "CABELO")]
    public void Normalize_drops_accent_case_and_extra_spaces(string text, string expected) =>
        Assert.Equal(expected, SearchText.Normalize(text));

    [Fact]
    public void Expand_adds_the_synonyms_and_treats_a_simple_plural_as_the_singular()
    {
        Assert.Contains("CORTE", SearchText.Expand("cabelo"));
        Assert.Contains("MANICURE", SearchText.Expand("Unhas"));
        Assert.Contains("DRENAGEM", SearchText.Expand("massagem"));
        Assert.Equal(["TATUAGEM"], SearchText.Expand("tatuagem"));
        Assert.Empty(SearchText.Expand("   "));
    }

    [Fact]
    public void Matches_compares_normalized_text_against_any_expanded_term()
    {
        IReadOnlyList<string> hair = SearchText.Expand("cabêlo");

        Assert.True(SearchText.Matches("Corte masculino", hair));
        Assert.True(SearchText.Matches("Hidratação", hair));
        Assert.False(SearchText.Matches("Manicure", hair));
        Assert.False(SearchText.Matches("Qualquer coisa", []));
    }
}
