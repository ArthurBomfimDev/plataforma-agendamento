namespace Booking.Domain.Enum.Module.Tenancy;

// Papéis do glossário canônico (CLAUDE.md §2): Owner e Professional são papéis, não tipos de conta.
// Attendant (atendente) opera a agenda e os pedidos de todos os profissionais, sem editar o estabelecimento.
public enum BusinessMembershipRole
{
    Owner,
    Professional,
    Attendant,
}
