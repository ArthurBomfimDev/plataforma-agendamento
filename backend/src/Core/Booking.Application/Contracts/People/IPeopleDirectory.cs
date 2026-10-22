namespace Booking.Application.Contracts.People;

public sealed record ProfessionalInfo(Guid ProfessionalId, Guid BusinessId, string DisplayName, bool IsActive, Guid? MembershipId);

/// <summary>Superfície pública do módulo People.</summary>
public interface IPeopleDirectory
{
    /// <summary>Profissional de um estabelecimento informado explicitamente.</summary>
    Task<ProfessionalInfo?> GetProfessionalAsync(Guid businessId, Guid professionalId, CancellationToken ct = default);

    Task<int> CountActiveProfessionalsAsync(Guid businessId, CancellationToken ct = default);

    Task<Guid?> FindProfessionalIdByMembershipAsync(Guid businessId, Guid membershipId, CancellationToken ct = default);

    /// <summary>Perfil de consumidor do usuário, se existir.</summary>
    Task<Guid?> FindCustomerIdAsync(Guid userId, CancellationToken ct = default);
}
