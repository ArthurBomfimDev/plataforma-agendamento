using System.Globalization;
using System.Text;

namespace Booking.Application.Common.Search;

/// <summary>
/// Texto da busca (ADR-024): comparação sem acento, sem caixa e com espaços normalizados, e um dicionário curto de
/// sinônimos mantido no código. Roda em memória sobre os candidatos que o filtro geográfico já cortou (até 500), então
/// não precisa da extensão <c>unaccent</c> nem de migration.
/// </summary>
public static class SearchText
{
    /// <summary>
    /// O que a pessoa digita → o que os estabelecimentos escrevem nos serviços e nos nomes. Chaves e valores já
    /// normalizados. Curto de propósito: as entradas de cabelo, unha, sobrancelha, pele e saúde cobrem os serviços do
    /// seed (Corte, Escova, Coloração, Hidratação, Manicure, Pedicure, Pé e mão, Design de sobrancelha, Pigmentação,
    /// Limpeza de pele, as sessões de saúde); a de massagem vem do pedido da Onda 7CF e ainda não tem serviço no seed.
    /// Termo fora daqui cai na comparação simples, que continua valendo.
    /// </summary>
    private static readonly Dictionary<string, string[]> _synonyms = new()
    {
        ["CABELO"] = ["CORTE", "ESCOVA", "COLORACAO", "HIDRATACAO", "BARBEARIA", "CABELEIREIR", "SALAO"],
        ["BARBA"] = ["BARBEARIA", "BARBEIRO"],
        ["UNHA"] = ["MANICURE", "PEDICURE", "PE E MAO", "ESMALTERIA"],
        ["MASSAGEM"] = ["RELAXANTE", "DRENAGEM", "MASSOTERAPIA"],
        ["SOBRANCELHA"] = ["DESIGN DE SOBRANCELHA", "PIGMENTACAO"],
        ["PELE"] = ["LIMPEZA DE PELE", "ESTETICA"],
        ["FISIOTERAPEUTA"] = ["FISIOTERAP"],
        ["PSICOLOGO"] = ["PSICOLOG", "PSICOTERAPIA"],
        ["PSICOLOGA"] = ["PSICOLOG", "PSICOTERAPIA"],
        ["NUTRICIONISTA"] = ["NUTRICAO", "NUTRICIONISTA"],
        ["FONO"] = ["FONOAUDIOLOG"],
    };

    /// <summary>"Coloração", "coloracao" e " COLORAÇÃO " viram "COLORACAO".</summary>
    public static string Normalize(string text)
    {
        string decomposed = text.Trim().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);

        foreach (char c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(c);
            }
        }

        return string.Join(' ', builder.ToString().ToUpperInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    /// <summary>
    /// O termo normalizado e os sinônimos dele. Plural simples ("unhas", "cabelos") conta como o singular.
    /// </summary>
    public static IReadOnlyList<string> Expand(string term)
    {
        string normalized = Normalize(term);
        if (normalized.Length == 0)
        {
            return [];
        }

        string singular = normalized.Length > 3 && normalized.EndsWith('S') ? normalized[..^1] : normalized;
        string[] extra = _synonyms.GetValueOrDefault(normalized) ?? _synonyms.GetValueOrDefault(singular) ?? [];

        return [.. new[] { normalized, singular }.Concat(extra).Distinct()];
    }

    /// <summary>Algum dos termos expandidos aparece no texto (nome de serviço, de estabelecimento ou de categoria).</summary>
    public static bool Matches(string text, IReadOnlyList<string> expanded)
    {
        if (expanded.Count == 0)
        {
            return false;
        }

        string normalized = Normalize(text);
        return expanded.Any(normalized.Contains);
    }
}
