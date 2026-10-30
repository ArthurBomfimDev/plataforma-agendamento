using System.Text;
using Booking.Application.Module.Notifications.Email;
using Booking.Domain.Entity.Module.Notifications;

namespace Booking.UnitTests.Notifications;

public sealed class NotificationsTests
{
    private static readonly DateTimeOffset _now = new(2026, 10, 28, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Retry_delay_doubles_from_30_seconds_up_to_one_hour()
    {
        Assert.Equal(TimeSpan.FromSeconds(30), OutboxMessage.RetryDelay(1));
        Assert.Equal(TimeSpan.FromMinutes(1), OutboxMessage.RetryDelay(2));
        Assert.Equal(TimeSpan.FromMinutes(2), OutboxMessage.RetryDelay(3));
        Assert.Equal(TimeSpan.FromHours(1), OutboxMessage.RetryDelay(8));
        Assert.Equal(TimeSpan.FromHours(1), OutboxMessage.RetryDelay(20));
    }

    [Fact]
    public void Delivery_gives_up_after_the_last_attempt_and_keeps_the_payload_for_a_manual_resend()
    {
        OutboxMessage message = OutboxMessage.Create("email", """{"to":"a@exemplo.test"}""", _now);

        for (int attempt = 1; attempt < OutboxMessage.MaxAttempts; attempt++)
        {
            message.RecordFailure(_now, "falhou");
            Assert.True(message.IsPending);
        }

        message.RecordFailure(_now, new string('x', 5000));

        Assert.False(message.IsPending);
        Assert.NotNull(message.FailedAt);
        Assert.Equal(OutboxMessage.MaxErrorLength, message.LastError!.Length);
        Assert.Contains("a@exemplo.test", message.Payload);
    }

    [Fact]
    public void Processed_delivery_drops_its_payload()
    {
        OutboxMessage message = OutboxMessage.Create("email", """{"text":"token=segredo"}""", _now);

        message.MarkProcessed(_now);

        Assert.False(message.IsPending);
        Assert.Equal("{}", message.Payload);
    }

    [Fact]
    public void Ics_lines_are_folded_at_75_octets_with_crlf_and_text_is_escaped()
    {
        string summary = $"Coloração; corte, escova — {new string('ã', 60)}";
        string ics = IcsCalendar.Request(
            new IcsEvent(Guid.CreateVersion7(), _now, _now.AddHours(1), summary, "Rua A, 1", "linha 1\nlinha 2", Sequence: 0),
            "Vagoo",
            _now);

        Assert.EndsWith("\r\n", ics);
        Assert.DoesNotContain("\n", ics.Replace("\r\n", string.Empty, StringComparison.Ordinal));

        foreach (string line in ics.Split("\r\n", StringSplitOptions.RemoveEmptyEntries))
        {
            Assert.True(Encoding.UTF8.GetByteCount(line) <= 75, $"linha com mais de 75 octetos: {line}");
        }

        string unfolded = ics.Replace("\r\n ", string.Empty, StringComparison.Ordinal);
        Assert.Contains("SUMMARY:Coloração\\; corte\\, escova", unfolded);
        Assert.Contains("LOCATION:Rua A\\, 1", unfolded);
        Assert.Contains("DESCRIPTION:linha 1\\nlinha 2", unfolded);
    }

    [Fact]
    public void Layout_escapes_every_external_text_in_html()
    {
        var settings = new NotificationSettings("Vagoo", "http://app.exemplo.test");

        var message = EmailLayout.Build(
            settings,
            "a@exemplo.test",
            "<script>alert(1)</script>",
            "Assunto",
            "Prévia",
            "Título",
            ["Motivo: <b>urgente</b>"],
            [new EmailDetail("Onde", "Salão \"Tia\" & Cia")]);

        Assert.DoesNotContain("<script>", message.HtmlBody);
        Assert.DoesNotContain("<b>urgente</b>", message.HtmlBody);
        Assert.Contains("&lt;script&gt;", message.HtmlBody);
        // O HtmlEncode também codifica os acentos (ã → &#227;): o leitor de e-mail mostra igual.
        Assert.Contains("&quot;Tia&quot; &amp; Cia", message.HtmlBody);
        Assert.Contains("Motivo: <b>urgente</b>", message.TextBody);
    }
}
