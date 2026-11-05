using Booking.Domain.Exceptions;

namespace Booking.Domain.ValueObject;

public sealed record Document
{
    public string Number { get; }

    // Derivado do tamanho: 11 caracteres só pode ser CPF válido, 14 só pode ser CNPJ válido (numérico ou alfanumérico),
    // porque o dígito verificador já foi conferido no Of(). `Business.DocumentType` guarda este valor para consulta.
    public DocumentKind Kind => Number.Length == 11 ? DocumentKind.Cpf : DocumentKind.Cnpj;

    private Document(string number)
    {
        Number = number;
    }

    public static Document Of(string rawNumber)
    {
        if (string.IsNullOrWhiteSpace(rawNumber))
        {
            throw new DomainException("document.required");
        }

        string number = Normalize(rawNumber);

        bool valid = number.Length switch
        {
            11 => IsValidCpf(number),
            14 => IsValidCnpj(number),
            _ => throw new DomainException("document.invalid_length"),
        };

        if (!valid)
        {
            throw new DomainException("document.invalid_check_digit");
        }

        return new Document(number);
    }

    /// <summary>
    /// Tira a pontuação (<c>. - /</c> e espaços) e põe em maiúsculas. Não descarta letra: o CNPJ alfanumérico
    /// (IN RFB 2.229/2024, desde 31/07/2026) tem letras nas 12 primeiras posições, e descartá-las o truncaria.
    /// </summary>
    private static string Normalize(string raw) =>
        new([.. raw.Where(c => c is not ('.' or '-' or '/') && !char.IsWhiteSpace(c)).Select(char.ToUpperInvariant)]);

    private static bool IsValidCpf(string d)
    {
        if (!d.All(char.IsAsciiDigit) || d.Distinct().Count() == 1)
        {
            return false;
        }

        int[] weights1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
        int[] weights2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

        int d1 = CheckDigit(d[..9], weights1);
        int d2 = CheckDigit(d[..9] + d1, weights2);

        return d[9] - '0' == d1 && d[10] - '0' == d2;
    }

    // 14 caracteres: os 12 primeiros A-Z ou 0-9 e os 2 últimos (dígitos verificadores) só numéricos. O valor de cada
    // caractere é o código ASCII menos 48, então o CNPJ numérico antigo cai no mesmo cálculo.
    private static bool IsValidCnpj(string d)
    {
        bool shape = d[..12].All(c => char.IsAsciiDigit(c) || char.IsAsciiLetterUpper(c)) && d[12..].All(char.IsAsciiDigit);

        if (!shape || d.Distinct().Count() == 1)
        {
            return false;
        }

        int[] weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        int[] weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        int d1 = CheckDigit(d[..12], weights1);
        int d2 = CheckDigit(d[..12] + d1, weights2);

        return d[12] - '0' == d1 && d[13] - '0' == d2;
    }

    private static int CheckDigit(string digits, int[] weights)
    {
        int sum = digits.Select((c, i) => (c - '0') * weights[i]).Sum(); // c - '0' == ASCII - 48, também para letras
        int remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }

    public override string ToString() => Number;
}
