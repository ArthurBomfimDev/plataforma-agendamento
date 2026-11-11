using Booking.Domain.Entity.Base;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Persistence.Context;

/// <summary>
/// Único lugar autorizado a desligar o filtro global de tenant (ADR-003). Todo uso aparece aqui,
/// para que a revisão de multi-tenancy tenha um ponto só para auditar.
/// </summary>
/// <remarks>
/// Desliga apenas o filtro nomeado <c>Tenant</c> e sempre devolve um predicado explícito no lugar.
/// Usos legítimos: leitura pública de um estabelecimento (vitrine, horários), leitura do próprio
/// consumidor (conta global, fora do tenant) e a troca de contexto, que ainda não tem tenant no token.
/// </remarks>
internal static class TenantScope
{
    private static readonly string[] _tenantFilter = ["Tenant"];

    /// <summary>Linhas de um estabelecimento informado explicitamente, sem depender do token.</summary>
    public static IQueryable<T> OfBusiness<T>(this BookingDbContext context, Guid businessId)
        where T : class, ITenantScoped =>
        context.Set<T>().IgnoreQueryFilters(_tenantFilter).Where(x => x.BusinessId == businessId);

    /// <summary>Todas as linhas, de todos os estabelecimentos. O chamador é obrigado a filtrar por outra chave.</summary>
    public static IQueryable<T> AcrossTenants<T>(this BookingDbContext context)
        where T : class, ITenantScoped =>
        context.Set<T>().IgnoreQueryFilters(_tenantFilter);
}
