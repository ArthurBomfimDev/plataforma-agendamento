namespace Booking.Domain.DomainService.Module.Availability;

/// <summary>
/// Feriados nacionais calculados, não consultados em serviço externo: custo zero e sem dependência de
/// terceiros. Os fixos são constantes; o móvel deriva da Páscoa.
/// </summary>
/// <remarks>
/// Só entram feriados nacionais por lei. Carnaval e Corpus Christi são ponto facultativo no âmbito federal
/// e ficam de fora; feriados estaduais e municipais também — cada estabelecimento abre ou fecha por exceção.
/// </remarks>
public static class BrazilianHolidays
{
    private static readonly (int Month, int Day, string Name)[] _fixed =
    [
        (1, 1, "Confraternização Universal"),
        (4, 21, "Tiradentes"),
        (5, 1, "Dia do Trabalho"),
        (9, 7, "Independência do Brasil"),
        (10, 12, "Nossa Senhora Aparecida"),
        (11, 2, "Finados"),
        (11, 15, "Proclamação da República"),
        (11, 20, "Dia Nacional de Zumbi e da Consciência Negra"),
        (12, 25, "Natal"),
    ];

    public static string? NameOf(DateOnly date)
    {
        foreach ((int month, int day, string name) in _fixed)
        {
            if (date.Month == month && date.Day == day)
            {
                return name;
            }
        }

        return date == Easter(date.Year).AddDays(-2) ? "Sexta-feira Santa" : null;
    }

    public static bool IsHoliday(DateOnly date) => NameOf(date) is not null;

    /// <summary>Domingo de Páscoa no calendário gregoriano (algoritmo anônimo de Meeus/Jones/Butcher).</summary>
    public static DateOnly Easter(int year)
    {
        int a = year % 19;
        int b = year / 100;
        int c = year % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = ((19 * a) + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + (2 * e) + (2 * i) - h - k) % 7;
        int m = (a + (11 * h) + (22 * l)) / 451;
        int month = (h + l - (7 * m) + 114) / 31;
        int day = ((h + l - (7 * m) + 114) % 31) + 1;

        return new DateOnly(year, month, day);
    }
}
