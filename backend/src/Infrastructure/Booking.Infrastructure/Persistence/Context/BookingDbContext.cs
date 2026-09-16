using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Persistence.Context;

/// <summary>
/// Um DbContext, um banco, um schema (ADR-003, ADR-007).
/// </summary>
/// <remarks>
/// As configurações ficam em <c>Module/&lt;Contexto&gt;/Mapping</c> e mapeiam a entidade de domínio
/// diretamente, com Fluent API e backing fields para os setters privados. Não existe entidade de
/// persistência separada (ADR-010, decisão 5) — verificado por PersistenceMappingTests.
/// </remarks>
public sealed class BookingDbContext(DbContextOptions<BookingDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BookingDbContext).Assembly);
    }
}
