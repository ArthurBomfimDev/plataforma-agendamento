namespace Booking.Application.Contracts.Tenancy;

public sealed record BusinessMembershipInfo(Guid MembershipId, Guid BusinessId, Guid UserId, string Role);

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

/// <summary>Superfície pública do módulo Tenancy.</summary>
public interface IBusinessDirectory
{
    /// <summary>Vínculo ativo do usuário com o estabelecimento, sem depender do tenant do token.</summary>
    Task<BusinessMembershipInfo?> FindActiveMembershipAsync(Guid businessId, Guid userId, CancellationToken ct = default);

    Task<BusinessSchedulingInfo?> GetSchedulingInfoAsync(Guid businessId, CancellationToken ct = default);
}
