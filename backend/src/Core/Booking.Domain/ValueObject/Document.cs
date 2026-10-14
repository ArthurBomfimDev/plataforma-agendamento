using Booking.Domain.Exceptions;

namespace Booking.Domain.ValueObject;

public sealed record Document
{
    public string Number { get; }

    // Derivado do tamanho, nunca persistido separadamente — 11 dígitos só pode ser CPF válido,
    // 14 só pode ser CNPJ válido, porque o dígito verificador já foi conferido no Of().
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

        string digits = new([.. rawNumber.Where(char.IsDigit)]);

        bool valid = digits.Length switch
        {
            11 => IsValidCpf(digits),
            14 => IsValidCnpj(digits),
            _ => throw new DomainException("document.invalid_length"),
        };

        if (!valid)
        {
            throw new DomainException("document.invalid_check_digit");
        }

        return new Document(digits);
    }

    private static bool IsValidCpf(string d)
    {
        if (d.Distinct().Count() == 1)
        {
            return false;
        }

        int[] weights1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
        int[] weights2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

        int d1 = CheckDigit(d[..9], weights1);
        int d2 = CheckDigit(d[..9] + d1, weights2);

        return d[9] - '0' == d1 && d[10] - '0' == d2;
    }

    private static bool IsValidCnpj(string d)
    {
        if (d.Distinct().Count() == 1)
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
        int sum = digits.Select((c, i) => (c - '0') * weights[i]).Sum();
        int remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }

    public override string ToString() => Number;
}
