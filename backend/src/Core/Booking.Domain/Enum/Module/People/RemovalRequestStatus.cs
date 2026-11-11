namespace Booking.Domain.Enum.Module.People;

/// <summary>Situação de um pedido de remoção de perfil: aberto na fila do Admin, ou resolvido por ele.</summary>
public enum RemovalRequestStatus
{
    Open,
    Resolved,
}
