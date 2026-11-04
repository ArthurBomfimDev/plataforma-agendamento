using Booking.Application.Module.Notifications.Email;

namespace Booking.UnitTests.Notifications;

/// <summary>
/// O <c>.ics</c> lido de volta como um cliente de agenda leria: desdobra as linhas e separa as propriedades. Prova o que
/// a agenda do consumidor precisa para atualizar (mesmo UID, SEQUENCE maior) e remover (METHOD:CANCEL) um evento.
/// </summary>
public sealed class IcsCalendarTests
{
    private static readonly DateTimeOffset _now = new(2026, 11, 4, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid _appointment = Guid.Parse("0197f3a2-7b1c-7d2e-9a40-3c5b8e1f2a60");

    private static IcsEvent Event(int sequence, string summary = "Corte — Estúdio Duartina", string? location = "Rua das Flores, 100, Garça") =>
        new(_appointment, _now.AddDays(2), _now.AddDays(2).AddMinutes(45), summary, location, "Mapa: https://exemplo.test/mapa", sequence);

    /// <summary>Propriedades do VEVENT (e do VCALENDAR) em um dicionário; o que se repete (DESCRIPTION do alarme) fica de fora.</summary>
    private static (Dictionary<string, string> Calendar, Dictionary<string, string> Event, List<string> Components) Parse(string ics)
    {
        string unfolded = ics.Replace("\r\n ", string.Empty, StringComparison.Ordinal);
        var calendar = new Dictionary<string, string>();
        var vevent = new Dictionary<string, string>();
        var components = new List<string>();
        var stack = new Stack<string>();

        foreach (string line in unfolded.Split("\r\n", StringSplitOptions.RemoveEmptyEntries))
        {
            if (line.StartsWith("BEGIN:", StringComparison.Ordinal))
            {
                stack.Push(line[6..]);
                components.Add(line[6..]);
                continue;
            }

            if (line.StartsWith("END:", StringComparison.Ordinal))
            {
                Assert.Equal(line[4..], stack.Pop());
                continue;
            }

            int colon = line.IndexOf(':', StringComparison.Ordinal);
            string key = line[..colon];
            string value = line[(colon + 1)..];

            // Só as propriedades do próprio VCALENDAR e do próprio VEVENT; as do VALARM ficam de fora.
            if (stack.Peek() == "VCALENDAR")
            {
                calendar[key] = value;
            }
            else if (stack.Peek() == "VEVENT")
            {
                vevent[key] = value;
            }
        }

        Assert.Empty(stack);
        return (calendar, vevent, components);
    }

    [Fact]
    public void Confirmation_is_a_request_with_a_stable_uid_a_one_hour_alarm_and_the_location()
    {
        (Dictionary<string, string> calendar, Dictionary<string, string> vevent, List<string> components) =
            Parse(IcsCalendar.Request(Event(sequence: 0), "Vagoo", _now));

        Assert.Equal("REQUEST", calendar["METHOD"]);
        Assert.Equal($"appointment-{_appointment}@booking", vevent["UID"]);
        Assert.Equal("0", vevent["SEQUENCE"]);
        Assert.Equal("CONFIRMED", vevent["STATUS"]);
        Assert.Equal("Rua das Flores\\, 100\\, Garça", vevent["LOCATION"]);
        Assert.Contains("VALARM", components);
    }

    [Fact]
    public void Cancellation_keeps_the_same_uid_raises_the_sequence_and_is_a_cancel_without_alarm()
    {
        var confirmed = Parse(IcsCalendar.Request(Event(sequence: 0), "Vagoo", _now));
        var cancelled = Parse(IcsCalendar.Cancel(Event(sequence: 1), "Vagoo", _now.AddHours(1)));

        Assert.Equal("CANCEL", cancelled.Calendar["METHOD"]);
        Assert.Equal("CANCELLED", cancelled.Event["STATUS"]);
        Assert.Equal(confirmed.Event["UID"], cancelled.Event["UID"]);
        Assert.True(int.Parse(cancelled.Event["SEQUENCE"]) > int.Parse(confirmed.Event["SEQUENCE"]));
        Assert.Equal(confirmed.Event["DTSTART"], cancelled.Event["DTSTART"]);
        Assert.DoesNotContain("VALARM", cancelled.Components);
    }

    [Fact]
    public void Every_line_stays_within_75_octets_and_ends_in_crlf_after_a_cancellation_too()
    {
        string ics = IcsCalendar.Cancel(Event(sequence: 2, summary: $"Atendimento — {new string('ã', 80)}"), "Vagoo", _now);

        Assert.EndsWith("\r\n", ics);
        foreach (string line in ics.Split("\r\n", StringSplitOptions.RemoveEmptyEntries))
        {
            Assert.True(System.Text.Encoding.UTF8.GetByteCount(line) <= 75, $"linha com mais de 75 octetos: {line}");
        }
    }

    [Fact]
    public void Health_summary_stays_generic_when_the_caller_builds_it_without_the_service()
    {
        // Quem monta o IcsEvent decide o título (AppointmentNotifier). Em Saúde: "Atendimento — {nome}", nunca o serviço.
        (_, Dictionary<string, string> vevent, _) = Parse(IcsCalendar.Request(Event(0, summary: "Atendimento — Clínica Vida"), "Vagoo", _now));

        Assert.Equal("Atendimento — Clínica Vida", vevent["SUMMARY"]);
        Assert.DoesNotContain("psic", vevent["SUMMARY"], StringComparison.OrdinalIgnoreCase);
    }
}
