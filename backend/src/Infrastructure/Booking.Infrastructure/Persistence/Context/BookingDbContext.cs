using System.Reflection;
using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Scheduling;
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
        IReadOnlyList<long> slotLocks = SlotLockKeys();

        try
        {
            if (slotLocks.Count == 0)
            {
                return base.SaveChanges(acceptAllChangesOnSuccess);
            }

            using var transaction = Database.CurrentTransaction is null ? Database.BeginTransaction() : null;

            foreach (long key in slotLocks)
            {
                Database.ExecuteSql($"SELECT pg_advisory_xact_lock({key})");
            }

            int written = base.SaveChanges(acceptAllChangesOnSuccess);
            transaction?.Commit();
            return written;
        }
        catch (DbUpdateException e) when (Translate(e) is DomainException domain)
        {
            throw domain;
        }
    }

    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        StampAuditColumns();
        IReadOnlyList<long> slotLocks = SlotLockKeys();

        try
        {
            if (slotLocks.Count == 0)
            {
                return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
            }

            await using var transaction = Database.CurrentTransaction is null
                ? await Database.BeginTransactionAsync(cancellationToken)
                : null;

            foreach (long key in slotLocks)
            {
                await Database.ExecuteSqlAsync($"SELECT pg_advisory_xact_lock({key})", cancellationToken);
            }

            int written = await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);

            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return written;
        }
        catch (DbUpdateException e) when (Translate(e) is DomainException domain)
        {
            throw domain;
        }
    }

    /// <summary>
    /// ADR-019: quem grava agendamento que ocupa horário entra na fila do profissional antes do INSERT. O lock é da
    /// transação (<c>pg_advisory_xact_lock</c>) e sai no commit ou no rollback. Ele só ordena a fila — quem recusa a
    /// sobreposição continua sendo <c>appointment_no_overlap</c> (ADR-005). Sem ele, inserções conflitantes
    /// simultâneas esperavam umas pelas outras dentro da checagem da constraint e o PostgreSQL abortava com 40P01.
    /// </summary>
    /// <remarks>Mais de um profissional na mesma gravação: chaves em ordem crescente, para a fila não criar deadlock próprio.</remarks>
    private List<long> SlotLockKeys() =>
        [
            .. ChangeTracker.Entries<Appointment>()
                .Where(e => e.State == EntityState.Added && Appointment.OccupiesSlot(e.Entity.Status))
                .Select(e => SlotLockKey(e.Entity.ProfessionalId))
                .Distinct()
                .Order(),
        ];

    /// <summary>Chave estável de 64 bits por profissional: as duas metades do Guid combinadas.</summary>
    private static long SlotLockKey(Guid professionalId)
    {
        Span<byte> bytes = stackalloc byte[16];
        professionalId.TryWriteBytes(bytes);
        return BitConverter.ToInt64(bytes[..8]) ^ BitConverter.ToInt64(bytes[8..]);
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
