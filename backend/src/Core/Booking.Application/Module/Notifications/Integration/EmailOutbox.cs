using System.Text.Json;
using Booking.Application.Contracts.Notifications;
using Booking.Domain.Entity.Module.Notifications;
using Booking.Domain.Interface.Repository.Module.Notifications;

namespace Booking.Application.Module.Notifications.Integration;

public static class OutboxTypes
{
    public const string Email = "email";
}

/// <summary>Grava o e-mail na outbox, no mesmo <c>DbContext</c> da requisição. Quem chama faz o <c>SaveChanges</c>.</summary>
public sealed class EmailOutbox(IOutboxRepository outbox, TimeProvider clock) : IEmailOutbox
{
    public void Enqueue(EmailMessage message) =>
        outbox.Add(OutboxMessage.Create(OutboxTypes.Email, JsonSerializer.Serialize(message, JsonSerializerOptions.Web), clock.GetUtcNow()));
}
