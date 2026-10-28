using System.Globalization;

namespace Booking.Application.Module.Notifications.Email;

/// <summary>
/// Data e hora no fuso do estabelecimento, em português, sem depender da cultura instalada: a imagem do contêiner
/// pode rodar com globalização invariante. Fuso por identificador IANA, nunca offset fixo.
/// </summary>
public static class EmailDates
{
    private static readonly string[] _weekdays = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

    private static readonly string[] _months =
        ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

    /// <summary>"quinta-feira, 30 de outubro, às 10:00".</summary>
    public static string Long(DateTimeOffset instant, string timeZone)
    {
        DateTime local = TimeZoneInfo.ConvertTime(instant, TimeZoneInfo.FindSystemTimeZoneById(timeZone)).DateTime;
        return string.Create(
            CultureInfo.InvariantCulture,
            $"{_weekdays[(int)local.DayOfWeek]}, {local.Day} de {_months[local.Month - 1]}, às {local:HH':'mm}");
    }

    /// <summary>"30/10 às 10:00" — curto, para assunto.</summary>
    public static string Short(DateTimeOffset instant, string timeZone)
    {
        DateTime local = TimeZoneInfo.ConvertTime(instant, TimeZoneInfo.FindSystemTimeZoneById(timeZone)).DateTime;
        return local.ToString("dd'/'MM 'às' HH':'mm", CultureInfo.InvariantCulture);
    }
}
