using System.Collections.Concurrent;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Module.Notifications.Email;

namespace Booking.IntegrationTests.Infrastructure;

/// <summary>Uma entrega capturada: o id da linha da outbox e o e-mail.</summary>
public sealed record SentEmail(Guid DeliveryId, EmailMessage Message);

/// <summary>
/// Canal de e-mail falso: guarda em memória o que seria enviado. Nenhum teste fala com SMTP nem com rede externa.
/// Pode ser mandado falhar para um destinatário, para provar a nova tentativa.
/// </summary>
public sealed class FakeEmailSender : IEmailSender
{
    private readonly ConcurrentQueue<SentEmail> _sent = new();
    private readonly ConcurrentDictionary<string, int> _failuresLeft = new(StringComparer.OrdinalIgnoreCase);

    public IReadOnlyList<SentEmail> Sent => [.. _sent];

    public IReadOnlyList<EmailMessage> To(string address) =>
        [.. _sent.Where(s => s.Message.To.Equals(address, StringComparison.OrdinalIgnoreCase)).Select(s => s.Message)];

    /// <summary>As próximas <paramref name="times"/> tentativas para o endereço falham.</summary>
    public void FailNext(string address, int times) => _failuresLeft[address] = times;

    public Task SendAsync(EmailMessage message, Guid deliveryId, CancellationToken ct = default)
    {
        if (_failuresLeft.TryGetValue(message.To, out int left) && left > 0)
        {
            _failuresLeft[message.To] = left - 1;
            throw new InvalidOperationException("Falha de SMTP simulada pelo teste.");
        }

        _sent.Enqueue(new SentEmail(deliveryId, message));
        return Task.CompletedTask;
    }
}
