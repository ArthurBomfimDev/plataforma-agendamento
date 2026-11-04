using System.Globalization;
using System.Text;

namespace Booking.Application.Common.Search;

/// <summary>
/// Texto da busca (ADR-024): comparação sem acento, sem caixa, com radical simples do português e com sinônimos
/// mantidos no código. Roda em memória sobre os candidatos que o filtro geográfico já cortou (até 500), então não
/// precisa da extensão <c>unaccent</c> nem de migration.
/// </summary>
public static class SearchText
{
    /// <summary>
    /// Grupos de termos que a pessoa troca um pelo outro ("barbeiro", "barbearia", "barba"). Cada membro vira o radical
    /// dele; o grupo casa pelo radical do que foi digitado. Frase com mais de uma palavra casa só inteira. Já
    /// normalizados (sem acento, maiúsculas).
    /// </summary>
    private static readonly string[][] _groups =
    [
        ["BARBEIRO", "BARBEARIA", "BARBA", "CORTE MASCULINO"],
        ["MANICURE", "PEDICURE", "UNHA", "ESMALTERIA"],
        ["MASSAGISTA", "MASSAGEM", "MASSOTERAPIA", "MASSOTERAPEUTA"],
        ["PERSONAL", "TREINO", "TREINAMENTO", "PERSONAL TRAINER"],
        ["PSICOLOGO", "PSICOLOGA", "PSICOLOGIA", "PSICOTERAPIA"],
        ["NUTRICIONISTA", "NUTRICAO"],
        ["FISIOTERAPEUTA", "FISIOTERAPIA"],
        ["FONOAUDIOLOGO", "FONOAUDIOLOGA", "FONOAUDIOLOGIA", "FONO"],
    ];

    /// <summary>
    /// Termo → o que os estabelecimentos escrevem nos serviços e nos nomes, quando não é troca de igual para igual
    /// (a pessoa escreve a necessidade; o estabelecimento, o serviço). Chaves e valores já normalizados; os valores
    /// entram como estão. Termo fora daqui e dos grupos cai na comparação simples, que continua valendo.
    /// </summary>
    private static readonly Dictionary<string, string[]> _synonyms = new()
    {
        ["CABELO"] = ["CORTE", "ESCOVA", "COLORACAO", "HIDRATACAO", "BARBEARIA", "CABELEIREIR", "SALAO"],
        ["MASSAGEM"] = ["RELAXANTE", "DRENAGEM", "MASSOTERAPIA"],
        ["SOBRANCELHA"] = ["DESIGN DE SOBRANCELHA", "PIGMENTACAO"],
        ["PELE"] = ["LIMPEZA DE PELE", "ESTETICA"],
    };

    // Radical de cada membro de grupo → índice do grupo. Frase de várias palavras entra pela frase inteira.
    private static readonly Dictionary<string, int> _groupByKey = BuildGroupIndex();

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
    /// Radical simples de uma palavra já normalizada: tira o plural, um sufixo de profissão ou lugar (-EIRO, -EIRA,
    /// -ARIA, -ISTA, -OR, -ORA) e a vogal final. "BARBEIRO", "BARBEARIA" e "BARBA" dão "BARB"; "MANICURE" e "MANICURI",
    /// "MANICUR". Palavra curta não perde nada: um radical de 3 letras casaria com palavra demais.
    /// </summary>
    public static string Stem(string word)
    {
        string stem = word;

        if (stem.Length > 4 && stem.EndsWith("ES", StringComparison.Ordinal) && stem[^3] is 'R' or 'Z')
        {
            stem = stem[..^2];
        }
        else if (stem.Length > 3 && stem.EndsWith('S'))
        {
            stem = stem[..^1];
        }

        foreach (string suffix in (string[])["EIRO", "EIRA", "ARIA", "ISTA", "ORA", "OR"])
        {
            if (stem.EndsWith(suffix, StringComparison.Ordinal) && stem.Length - suffix.Length >= 3)
            {
                stem = stem[..^suffix.Length];
                break;
            }
        }

        if (stem.Length >= 5 && stem[^1] is 'A' or 'E' or 'I' or 'O')
        {
            stem = stem[..^1];
        }

        return stem;
    }

    /// <summary>
    /// O termo, o radical dele, o grupo de sinônimos e as entradas do dicionário. Cada palavra é reduzida ao radical;
    /// frase de várias palavras entra inteira.
    /// </summary>
    public static IReadOnlyList<string> Expand(string term)
    {
        string normalized = Normalize(term);
        if (normalized.Length == 0)
        {
            return [];
        }

        string singular = normalized.Length > 3 && normalized.EndsWith('S') ? normalized[..^1] : normalized;
        var terms = new List<string> { normalized, singular };

        if (!normalized.Contains(' '))
        {
            terms.Add(Stem(normalized));
        }

        if (FindGroup(normalized) is int group)
        {
            // O membro como está e o radical dele: o radical pega a variação ("manicuri"), o membro, a palavra inteira.
            terms.AddRange(_groups[group].SelectMany(member => member.Contains(' ') ? [member] : new[] { member, Stem(member) }));
        }

        foreach (string key in new[] { normalized, singular })
        {
            if (_synonyms.TryGetValue(key, out string[]? extra))
            {
                terms.AddRange(extra);
            }
        }

        return [.. terms.Where(t => t.Length > 0).Distinct()];
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

    private static int? FindGroup(string normalized)
    {
        if (_groupByKey.TryGetValue(normalized, out int byPhrase))
        {
            return byPhrase;
        }

        return normalized.Contains(' ') ? null : _groupByKey.TryGetValue(Stem(normalized), out int byStem) ? byStem : null;
    }

    private static Dictionary<string, int> BuildGroupIndex()
    {
        var index = new Dictionary<string, int>();

        for (int i = 0; i < _groups.Length; i++)
        {
            foreach (string member in _groups[i])
            {
                index.TryAdd(member.Contains(' ') ? member : Stem(member), i);
            }
        }

        return index;
    }
}
