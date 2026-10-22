using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Domain.ValueObject;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.Tenancy.Repository;

public sealed class BusinessRepository(BookingDbContext context) : IBusinessRepository
{
    public Task<Business?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Set<Business>().FirstOrDefaultAsync(x => x.Id == id, ct);

    // Compara o value object inteiro, como o UserRepository faz com Email: o EF traduz a igualdade
    // pela conversão; acesso a membro (x.Document.Number) não é traduzível.
    public Task<bool> ExistsByDocumentAsync(Document document, CancellationToken ct = default) =>
        context.Set<Business>().AnyAsync(x => x.Document == document, ct);

    // SQL explícito porque Location é GeoPoint convertido: o LINQ não enxerga o Point por trás dele.
    // ST_DWithin (e não ST_Distance < x) é o que usa o índice GiST.
    public async Task<IReadOnlyList<Business>> FindBookableNearbyAsync(
        GeoPoint center, double radiusMeters, int limit, CancellationToken ct = default) =>
        await context.Set<Business>()
            .FromSql($"""
                SELECT * FROM tenancy.business
                WHERE status = 'Active'
                  AND location_confirmed_at IS NOT NULL
                  AND ST_DWithin(location, ST_SetSRID(ST_MakePoint({center.Longitude}, {center.Latitude}), 4326)::geography, {radiusMeters})
                ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint({center.Longitude}, {center.Latitude}), 4326)::geography)
                LIMIT {limit}
                """)
            .AsNoTracking()
            .ToListAsync(ct);

    public void Add(Business business) => context.Set<Business>().Add(business);
}
