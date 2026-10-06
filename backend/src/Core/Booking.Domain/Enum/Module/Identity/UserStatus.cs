namespace Booking.Domain.Enum.Module.Identity;

public enum UserStatus
{
    Active,
    Inactive,   // desativação reversível, pelo próprio usuário
    Suspended,  // banimento, pelo Admin
    Deleted,    // pedido de exclusão LGPD, terminal, anonimizado
}
