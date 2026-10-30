using System.Globalization;
using System.Text;

namespace Booking.Application.Module.Notifications.Email;

/// <summary>Um evento de agendamento no formato iCalendar (RFC 5545).</summary>
public sealed record IcsEvent(
    Guid AppointmentId,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string Summary,
    string? Location,
    string? Description,
    int Sequence);

/// <summary>
/// Gera o <c>.ics</c> do agendamento, sem biblioteca: são poucas linhas fixas, e o texto inteiro fica à vista na
/// revisão. O <c>UID</c> é derivado do id do agendamento, para que um <c>.ics</c> novo do mesmo agendamento
/// atualize (mesmo <c>UID</c>, <c>SEQUENCE</c> maior) ou remova (<c>METHOD:CANCEL</c>) o evento já salvo.
/// </summary>
public static class IcsCalendar
{
    public const string ContentType = "text/calendar; charset=utf-8; method=REQUEST";

    public static string Uid(Guid appointmentId) => $"appointment-{appointmentId}@booking";

    /// <summary>Evento confirmado (<c>METHOD:REQUEST</c>), com alarme de 1 hora antes.</summary>
    public static string Request(IcsEvent e, string brandName, DateTimeOffset now)
    {
        var lines = new List<string>
        {
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            $"PRODID:-//{Escape(brandName)}//Agendamento//PT-BR",
            "CALSCALE:GREGORIAN",
            "METHOD:REQUEST",
            "BEGIN:VEVENT",
            $"UID:{Uid(e.AppointmentId)}",
            $"DTSTAMP:{Utc(now)}",
            $"DTSTART:{Utc(e.StartsAt)}",
            $"DTEND:{Utc(e.EndsAt)}",
            $"SEQUENCE:{e.Sequence.ToString(CultureInfo.InvariantCulture)}",
            "STATUS:CONFIRMED",
            $"SUMMARY:{Escape(e.Summary)}",
        };

        if (!string.IsNullOrWhiteSpace(e.Location))
        {
            lines.Add($"LOCATION:{Escape(e.Location)}");
        }

        if (!string.IsNullOrWhiteSpace(e.Description))
        {
            lines.Add($"DESCRIPTION:{Escape(e.Description)}");
        }

        lines.AddRange(
        [
            "BEGIN:VALARM",
            "TRIGGER:-PT1H",
            "ACTION:DISPLAY",
            $"DESCRIPTION:{Escape(e.Summary)}",
            "END:VALARM",
            "END:VEVENT",
            "END:VCALENDAR",
        ]);

        var ics = new StringBuilder();
        foreach (string line in lines)
        {
            AppendFolded(ics, line);
        }

        return ics.ToString();
    }

    private static string Utc(DateTimeOffset value) => value.UtcDateTime.ToString("yyyyMMdd'T'HHmmss'Z'", CultureInfo.InvariantCulture);

    /// <summary>Escape de texto do RFC 5545 (§3.3.11).</summary>
    private static string Escape(string value) =>
        value.Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace(";", "\\;", StringComparison.Ordinal)
            .Replace(",", "\\,", StringComparison.Ordinal)
            .Replace("\r\n", "\\n", StringComparison.Ordinal)
            .Replace("\n", "\\n", StringComparison.Ordinal);

    /// <summary>Linhas de até 75 octetos, continuação com um espaço, terminadas em CRLF (RFC 5545, §3.1).</summary>
    private static void AppendFolded(StringBuilder ics, string line)
    {
        const int maxOctets = 75;
        int octets = 0;
        bool first = true;

        foreach (Rune rune in line.EnumerateRunes())
        {
            int size = rune.Utf8SequenceLength;
            int limit = first ? maxOctets : maxOctets - 1;

            if (octets + size > limit)
            {
                ics.Append("\r\n ");
                octets = 0;
                first = false;
            }

            ics.Append(rune.ToString());
            octets += size;
        }

        ics.Append("\r\n");
    }
}
