using System.Reflection;
using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.Domain.Exceptions;
using Booking.Infrastructure.Persistence.Mapping.Base;
using Booking.Infrastructure.Persistence.Mapping.Module.Scheduling;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Booking.Infrastructure.Persistence.Context;

public sealed class BookingDbContext(DbContextOptions<BookingDbContext> options, ITenantContext tenantContext)
    : DbContext(options), IUnitOfWork
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

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        StampAuditColumns();

        try
        {
            return base.SaveChanges(acceptAllChangesOnSuccess);
        }
        catch (DbUpdateException e) when (Translate(e) is DomainException domain)
        {
            throw domain;
        }
    }

    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        StampAuditColumns();

        try
        {
            return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }
        catch (DbUpdateException e) when (Translate(e) is DomainException domain)
        {
            throw domain;
        }
    }

    /// <summary>
    /// A constraint de exclusão recusou a sobreposição (ADR-005): vira erro de domínio e HTTP 409, nunca 500.
    /// A violação do índice de idempotência é o toque duplo que chegou ao mesmo tempo.
    /// </summary>
    private static DomainException? Translate(DbUpdateException exception) =>
        exception.InnerException is PostgresException postgres
            ? (postgres.SqlState, postgres.ConstraintName) switch
            {
                (PostgresErrorCodes.ExclusionViolation, AppointmentMapping.NoOverlapConstraint) =>
                    new DomainException("appointment.slot_no_longer_available"),
                (PostgresErrorCodes.UniqueViolation, AppointmentMapping.IdempotencyIndex) =>
                    new DomainException("appointment.duplicate_request"),
                _ => null,
            }
            : null;

    private void StampAuditColumns()
    {
        ChangeTracker.DetectChanges();
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        foreach (var entry in ChangeTracker.Entries<IAuditable>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Property(AuditColumns.CreatedAt).CurrentValue = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Property(AuditColumns.UpdatedAt).CurrentValue = now;
            }
        }
    }

    private void ApplyTenantFilter<T>(ModelBuilder modelBuilder) where T : class, ITenantScoped
    {
        modelBuilder.Entity<T>().HasQueryFilter("Tenant", e => e.BusinessId == CurrentBusinessId);
    }
}
