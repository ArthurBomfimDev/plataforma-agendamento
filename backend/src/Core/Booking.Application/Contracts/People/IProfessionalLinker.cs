namespace Booking.Application.Contracts.People;

/// <summary>
/// Superfície do People para o aceite de convite: ligar o vínculo recém-criado a um perfil de profissional que o dono
/// já cadastrou, ou criar o perfil. Não grava: o chamador confirma tudo no mesmo <c>SaveChanges</c>.
/// </summary>
public interface IProfessionalLinker
{
    /// <summary>O perfil existe no estabelecimento, está ativo e ainda não tem conta ligada?</summary>
    Task<bool> IsLinkableAsync(Guid businessId, Guid professionalId, CancellationToken ct = default);

    Task LinkAsync(Guid businessId, Guid professionalId, Guid membershipId, CancellationToken ct = default);

    /// <summary>
    /// "Sair do estabelecimento": desativa o perfil ligado ao vínculo, que sai da vitrine na hora. O histórico de
    /// agendamentos permanece. Sem perfil ligado (atendente), não faz nada.
    /// </summary>
    Task DeactivateByMembershipAsync(Guid membershipId, CancellationToken ct = default);

    /// <summary>Cria o perfil do profissional já ligado ao vínculo.</summary>
    void Create(Guid businessId, string displayName, Guid membershipId);
}
