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

    [Theory]
    [InlineData("BARBEIRO", "BARB")]
    [InlineData("BARBEARIA", "BARB")]
    [InlineData("BARBA", "BARB")]
    [InlineData("BARBEIROS", "BARB")]
    [InlineData("MANICURE", "MANICUR")]
    [InlineData("MANICURI", "MANICUR")]
    [InlineData("MASSAGISTA", "MASSAG")]
    [InlineData("PSICOLOGA", "PSICOLOG")]
    [InlineData("UNHAS", "UNHA")]
    [InlineData("SPA", "SPA")] // palavra curta não perde nada
    public void Stem_drops_plural_profession_suffix_and_final_vowel(string word, string expected) =>
        Assert.Equal(expected, SearchText.Stem(word));

    // Os nomes e serviços que o seed e a vida real usam. Cada linha: o texto de um estabelecimento ou serviço.
    private static readonly string[] _barbershops = ["Barbearia do Zé", "Corte masculino", "Barba", "Barbeiro Premium"];

    [Theory]
    [InlineData("barbeiro")]
    [InlineData("barbearia")]
    [InlineData("barba")]
    [InlineData("Barbeiros")]
    [InlineData("corte masculino")]
    public void Barber_terms_find_the_same_barbershops(string term)
    {
        IReadOnlyList<string> wanted = SearchText.Expand(term);

        Assert.All(_barbershops, text => Assert.True(SearchText.Matches(text, wanted), $"'{term}' deveria achar '{text}'"));
        Assert.False(SearchText.Matches("Esmalteria da Ana", wanted));
        Assert.False(SearchText.Matches("Consultório de psicologia", wanted));
    }

    [Theory]
    [InlineData("manicuri", "Manicure e pedicure")]
    [InlineData("manicure", "Esmalteria Rosa")]
    [InlineData("unha", "Manicure")]
    [InlineData("unhas", "Pé e mão")] // serviço do seed; a regressão do dicionário antigo
    [InlineData("hidratacao", "Hidratação")]
    [InlineData("saude", "Saúde")]
    [InlineData("cabelo", "Corte masculino")]
    [InlineData("massagista", "Massagem relaxante")]
    [InlineData("massagem", "Massoterapia")]
    [InlineData("psicologa", "Psicólogo Silva")]
    [InlineData("psicologia", "Psicóloga Ana")]
    [InlineData("psicologo", "Atendimento de psicologia")]
    [InlineData("nutricao", "Nutricionista Lia")]
    [InlineData("nutricionista", "Consulta de nutrição")]
    [InlineData("fisioterapeuta", "Fisioterapia esportiva")]
    [InlineData("fisioterapia", "Fisioterapeuta João")]
    [InlineData("personal", "Treino funcional")]
    [InlineData("treino", "Personal trainer")]
    public void Variations_and_synonyms_of_a_job_find_each_other(string term, string text) =>
        Assert.True(SearchText.Matches(text, SearchText.Expand(term)), $"'{term}' deveria achar '{text}'");

    [Theory]
    [InlineData("tatuagem")]
    [InlineData("zzzxyz")]
    [InlineData("advogado")]
    public void An_unrelated_term_finds_nothing_in_the_catalog(string term)
    {
        IReadOnlyList<string> wanted = SearchText.Expand(term);
        string[] catalog =
        [
            "Barbearia do Zé", "Corte masculino", "Esmalteria da Ana", "Manicure", "Massagem relaxante", "Psicólogo Silva",
            "Nutricionista Lia", "Fisioterapia esportiva", "Personal trainer", "Estúdio Duartina", "Limpeza de pele",
        ];

        Assert.All(catalog, text => Assert.False(SearchText.Matches(text, wanted), $"'{term}' não deveria achar '{text}'"));
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
