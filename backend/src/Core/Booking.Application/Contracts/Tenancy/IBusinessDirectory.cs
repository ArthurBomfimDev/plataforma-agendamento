namespace Booking.Application.Contracts.Tenancy;

public sealed record BusinessMembershipInfo(Guid MembershipId, Guid BusinessId, Guid UserId, string Role);

public sealed record UserBusinessInfo(Guid BusinessId, string Name, string Role);

/// <summary>O que os outros módulos precisam saber de um estabelecimento para calcular horário e agendar.</summary>
public sealed record BusinessSchedulingInfo(
    Guid BusinessId,
    string TimeZone,
    bool IsBookable,
    bool RequiresSensitiveHandling,
    bool AutoConfirm,
    int PendingExpirationHours,
    int MinLeadTimeHours,
    int BookingHorizonDays,
    int CancellationWindowHours);

/// <summary>
/// O que um aviso ao consumidor mostra do estabelecimento. Ponto só quando confirmado pelo dono (ADR-016): sem ele,
/// o e-mail não traz link de mapa.
/// </summary>
public sealed record BusinessContactInfo(
    Guid BusinessId,
    string Name,
    string? AddressLine,
    double? Latitude,
    double? Longitude,
    string TimeZone,
    bool RequiresSensitiveHandling);

/// <summary>Superfície pública do módulo Tenancy.</summary>
public interface IBusinessDirectory
{
    Task<BusinessContactInfo?> GetContactInfoAsync(Guid businessId, CancellationToken ct = default);

    /// <summary>Contas com vínculo ativo de dono no estabelecimento.</summary>
    Task<IReadOnlyList<Guid>> ListActiveOwnerUserIdsAsync(Guid businessId, CancellationToken ct = default);

    /// <summary>Conta por trás de um vínculo ativo, ou nulo se o vínculo não existe ou não está ativo.</summary>
    Task<Guid?> FindActiveMembershipUserIdAsync(Guid businessId, Guid membershipId, CancellationToken ct = default);

    /// <summary>Vínculo ativo do usuário com o estabelecimento, sem depender do tenant do token.</summary>
    Task<BusinessMembershipInfo?> FindActiveMembershipAsync(Guid businessId, Guid userId, CancellationToken ct = default);

    /// <summary>
    /// Estabelecimentos em que o usuário tem vínculo ativo, em ordem de nome, até <paramref name="limit"/>. Atravessa os
    /// tenants de propósito: alimenta o seletor de contexto, antes de existir um estabelecimento no token.
    /// </summary>
    Task<IReadOnlyList<UserBusinessInfo>> ListActiveBusinessesOfUserAsync(Guid userId, int limit, CancellationToken ct = default);

    Task<BusinessSchedulingInfo?> GetSchedulingInfoAsync(Guid businessId, CancellationToken ct = default);
}
