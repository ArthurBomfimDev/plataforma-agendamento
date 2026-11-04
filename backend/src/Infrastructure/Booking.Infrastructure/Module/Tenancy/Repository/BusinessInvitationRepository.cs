using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Tenancy.Repository;

public sealed class BusinessInvitationRepository(BookingDbContext context) : IBusinessInvitationRepository
{
    public Task<BusinessInvitation?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Set<BusinessInvitation>().FirstOrDefaultAsync(x => x.Id == id, ct);

    // Entre estabelecimentos por natureza: quem abre o link ainda não tem tenant no token. A chave é o hash.
    public Task<BusinessInvitation?> GetByTokenHashAsync(string tokenHash, CancellationToken ct = default) =>
        context.AcrossTenants<BusinessInvitation>().FirstOrDefaultAsync(x => x.TokenHash == tokenHash, ct);

    // Ordem por id: o Guid v7 cresce com o tempo, então o mais recente aparece por último.
    public Task<PagedResult<BusinessInvitation>> ListPendingAsync(DateTimeOffset now, PageRequest page, CancellationToken ct = default) =>
        context.Set<BusinessInvitation>().AsNoTracking()
            .Where(x => x.AcceptedAt == null && x.RevokedAt == null && x.ExpiresAt > now)
            .OrderBy(x => x.Id)
            .ToPagedAsync(page, ct);

    public Task<int> CountPendingAsync(DateTimeOffset now, CancellationToken ct = default) =>
        context.Set<BusinessInvitation>()
            .CountAsync(x => x.AcceptedAt == null && x.RevokedAt == null && x.ExpiresAt > now, ct);

    public Task<bool> ExistsPendingForEmailAsync(string email, DateTimeOffset now, CancellationToken ct = default) =>
        context.Set<BusinessInvitation>()
            .AnyAsync(x => x.Email == email && x.AcceptedAt == null && x.RevokedAt == null && x.ExpiresAt > now, ct);

    public void Add(BusinessInvitation invitation) => context.Set<BusinessInvitation>().Add(invitation);
}
