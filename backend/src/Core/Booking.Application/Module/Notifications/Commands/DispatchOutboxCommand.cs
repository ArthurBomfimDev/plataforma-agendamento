using System.Text.Json;
using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Module.Notifications.Email;
using Booking.Application.Module.Notifications.Integration;
using Booking.Domain.Entity.Module.Notifications;
using Booking.Domain.Interface.Repository.Module.Notifications;

namespace Booking.Application.Module.Notifications.Commands;

/// <summary>Quantas entregas uma rodada tentou, e quantas deram certo.</summary>
public sealed record DispatchResult(int Claimed, int Sent, int Failed);

/// <summary>
/// Uma rodada do worker da outbox (ADR-021): reivindica as entregas vencidas, envia, e grava o resultado de cada uma
/// logo depois do envio. Fora de qualquer requisição.
/// </summary>
/// <remarks>
/// Entrega processada não volta a ser enviada. A garantia é de pelo menos uma vez: se o processo cair entre o envio e
/// a gravação, a linha volta a vencer depois de <see cref="Lease"/> e sai de novo, com o mesmo <c>Message-ID</c>.
/// </remarks>
public sealed class DispatchOutboxCommand(IOutboxRepository outbox, IEmailSender sender, IUnitOfWork unitOfWork, TimeProvider clock)
{
    public const int BatchSize = 50;
    public static readonly TimeSpan Lease = TimeSpan.FromMinutes(5);

    public async Task<DispatchResult> ExecuteAsync(CancellationToken ct = default)
    {
        IReadOnlyList<OutboxMessage> claimed = await outbox.ClaimDueAsync(clock.GetUtcNow(), Lease, BatchSize, ct);
        int sent = 0;
        int failed = 0;

        foreach (OutboxMessage message in claimed)
        {
            try
            {
                await DeliverAsync(message, ct);
                message.MarkProcessed(clock.GetUtcNow());
                sent++;
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                message.RecordFailure(clock.GetUtcNow(), $"{e.GetType().Name}: {e.Message}");
                failed++;
            }

            // Uma gravação por entrega: o que já saiu fica marcado, mesmo se a próxima derrubar o processo.
            await unitOfWork.SaveChangesAsync(ct);
        }

        return new DispatchResult(claimed.Count, sent, failed);
    }

    private Task DeliverAsync(OutboxMessage message, CancellationToken ct) =>
        message.Type switch
        {
            OutboxTypes.Email => sender.SendAsync(
                JsonSerializer.Deserialize<EmailMessage>(message.Payload, JsonSerializerOptions.Web)
                    ?? throw new InvalidOperationException("Payload de e-mail vazio."),
                message.Id,
                ct),
            _ => throw new InvalidOperationException($"Tipo de entrega desconhecido: {message.Type}."),
        };
}
