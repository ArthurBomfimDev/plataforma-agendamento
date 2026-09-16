using NetArchTest.Rules;

namespace Booking.ArchitectureTests.Support;

internal static class ArchAssert
{
    /// <summary>Falha listando cada tipo que viola a regra e o motivo apontado pelo NetArchTest.</summary>
    public static void Passes(TestResult result, string rule)
    {
        if (result.IsSuccessful)
        {
            return;
        }

        IEnumerable<string> lines = (result.FailingTypes ?? []).Select(type =>
            string.IsNullOrWhiteSpace(type.Explanation)
                ? $"  - {type.FullName}"
                : $"  - {type.FullName} → {type.Explanation}");

        Assert.Fail($"{rule}{Environment.NewLine}{string.Join(Environment.NewLine, lines)}");
    }

    public static void NoViolations(IReadOnlyCollection<string> violations, string rule)
    {
        if (violations.Count == 0)
        {
            return;
        }

        Assert.Fail($"{rule}{Environment.NewLine}{string.Join(Environment.NewLine, violations.Select(v => $"  - {v}"))}");
    }

    /// <summary>
    /// Prova que a regra funciona: acusa cada violação plantada e não acusa o contraexemplo correto.
    /// </summary>
    /// <remarks>
    /// Sem o contraexemplo, uma regra que acusa tudo passaria neste teste. Sem a violação plantada,
    /// uma regra que não acusa nada passaria no teste de produção. São as duas metades da prova.
    /// </remarks>
    public static void Detects(TestResult result, string[] violators, string[] compliant)
    {
        Assert.False(result.IsSuccessful, "A regra não acusou nenhuma violação na fixture — ela não está funcionando.");

        string[] failing = result.FailingTypes.Select(type => type.FullName).ToArray();

        foreach (string violator in violators)
        {
            Assert.Contains(violator, failing);
        }

        foreach (string type in compliant)
        {
            Assert.DoesNotContain(type, failing);
        }
    }
}
