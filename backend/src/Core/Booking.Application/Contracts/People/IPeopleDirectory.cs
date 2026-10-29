namespace Booking.Application.Contracts.People;

public sealed record ProfessionalInfo(Guid ProfessionalId, Guid BusinessId, string DisplayName, bool IsActive, Guid? MembershipId);

/// <summary>O que o People sabe de um consumidor para exibir o nome: a conta dele e o nome social, se houver.</summary>
public sealed record CustomerIdentity(Guid CustomerId, Guid UserId, string? SocialName);

/// <summary>Superfície pública do módulo People.</summary>
public interface IPeopleDirectory
{
    /// <summary>Profissional de um estabelecimento informado explicitamente.</summary>
    Task<ProfessionalInfo?> GetProfessionalAsync(Guid businessId, Guid professionalId, CancellationToken ct = default);

    Task<int> CountActiveProfessionalsAsync(Guid businessId, CancellationToken ct = default);

    Task<Guid?> FindProfessionalIdByMembershipAsync(Guid businessId, Guid membershipId, CancellationToken ct = default);

    /// <summary>Perfil de consumidor do usuário, se existir.</summary>
    Task<Guid?> FindCustomerIdAsync(Guid userId, CancellationToken ct = default);

    /// <summary>Os consumidores informados que existem. Conta global, fora do tenant (ADR-004).</summary>
    Task<IReadOnlyList<CustomerIdentity>> GetCustomersAsync(IReadOnlyCollection<Guid> customerIds, CancellationToken ct = default);
}
