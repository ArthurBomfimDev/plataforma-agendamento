using Booking.Application.Common.Tenancy;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Npgsql;

namespace Booking.IntegrationTests.Infrastructure;

/// <summary>
/// <see cref="BookingDbContext"/> fora da API, para gravar direto no banco (controle negativo da ADR-005). Guarda o
/// <see cref="PostgresException"/> original: o contexto o traduz em <c>DomainException</c> e o SQLSTATE se perderia.
/// </summary>
public sealed class DirectDbContext : IAsyncDisposable
{
    private readonly FailureCapture _capture = new();

    public DirectDbContext(string connectionString)
    {
        DbContextOptions<BookingDbContext> options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseNpgsql(connectionString, o => o.UseNetTopologySuite())
            .UseSnakeCaseNamingConvention()
            .AddInterceptors(_capture)
            .Options;

        Db = new BookingDbContext(options, new NoTenant());
    }

    public BookingDbContext Db { get; }

    public PostgresException? LastPostgresError => _capture.Last?.InnerException as PostgresException;

    public ValueTask DisposeAsync() => Db.DisposeAsync();

    private sealed class NoTenant : ITenantContext
    {
        public Guid? BusinessId => null;
    }

    private sealed class FailureCapture : SaveChangesInterceptor
    {
        public Exception? Last { get; private set; }

        public override void SaveChangesFailed(DbContextErrorEventData eventData) => Last = eventData.Exception;

        public override Task SaveChangesFailedAsync(DbContextErrorEventData eventData, CancellationToken cancellationToken = default)
        {
            Last = eventData.Exception;
            return Task.CompletedTask;
        }
    }
}
