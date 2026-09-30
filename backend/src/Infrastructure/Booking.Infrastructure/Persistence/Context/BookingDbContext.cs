using System.Reflection;
using Booking.Application.Common.Tenancy;
using Booking.Domain.Entity.Base;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Persistence.Context;

public sealed class BookingDbContext(DbContextOptions<BookingDbContext> options, ITenantContext tenantContext) : DbContext(options)
{
    public Guid? CurrentBusinessId => tenantContext.BusinessId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("postgis");
        modelBuilder.HasPostgresExtension("btree_gist");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BookingDbContext).Assembly);

        var apply = typeof(BookingDbContext).GetMethod(nameof(ApplyTenantFilter), BindingFlags.NonPublic | BindingFlags.Instance)!;

        foreach (var entityType in modelBuilder.Model.GetEntityTypes()
                     .Where(t => typeof(ITenantScoped).IsAssignableFrom(t.ClrType)))
        {
            apply.MakeGenericMethod(entityType.ClrType).Invoke(this, [modelBuilder]);
        }
    }

    private void ApplyTenantFilter<T>(ModelBuilder modelBuilder) where T : class, ITenantContext
    {
     modelBuilder.Entity<T>().HasQueryFilter("Tenant", e => e.BusinessId == CurrentBusinessId);
    }
}
