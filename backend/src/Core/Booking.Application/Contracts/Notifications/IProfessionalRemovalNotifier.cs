namespace Booking.Application.Contracts.Notifications;

/// <summary>
/// O pedido de remoção como o People o conhece. <c>Contact</c> é dado pessoal de quem pediu: vai só ao dono, por e-mail,
/// e nunca para log.
/// </summary>
public sealed record ProfessionalRemovalFacts(
    Guid BusinessId, string ProfessionalName, string Reason, string? Contact, bool RequiresSensitiveHandling);

/// <summary>
/// Avisa os donos de que alguém pediu a remoção de um perfil. Só enfileira (<see cref="IEmailOutbox"/>): o aviso é gravado
/// no mesmo <c>SaveChanges</c> do pedido, que quem chama faz depois.
/// </summary>
public interface IProfessionalRemovalNotifier
{
    Task NotifyAsync(ProfessionalRemovalFacts request, CancellationToken ct = default);
}
