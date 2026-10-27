using Booking.Application.Contracts.Identity;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Booking.IntegrationTests.Infrastructure;

/// <summary>
/// Um servidor, um banco e uma API por execução. Todas as classes de teste estão na mesma coleção, então
/// rodam uma depois da outra: a concorrência que o teste mede é a que ele mesmo cria, não a do xUnit.
/// </summary>
public sealed class IntegrationFixture : IAsyncLifetime
{
    public DatabaseServer Server { get; private set; } = null!;
    public BookingApiFactory Factory { get; private set; } = null!;
    public HttpClient Client { get; private set; } = null!;
    public string ConnectionString { get; private set; } = null!;
    public string DatabaseVersion { get; private set; } = null!;

    /// <summary>Hash Argon2 calculado uma vez e reaproveitado: ninguém faz login com ele, e 50 hashes custariam segundos.</summary>
    public string PasswordHash { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        // Sem isso o pool de threads cresce aos poucos e as 50 requisições não saem juntas.
        ThreadPool.GetMinThreads(out int workers, out int io);
        ThreadPool.SetMinThreads(Math.Max(workers, 128), Math.Max(io, 128));

        Server = await DatabaseServer.StartAsync();
        ConnectionString = await Server.CreateDatabaseAsync();
        Factory = new BookingApiFactory(ConnectionString);
        Client = Factory.CreateClient();

        await using AsyncServiceScope scope = Factory.Services.CreateAsyncScope();
        BookingDbContext db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        // Trava de segurança: se a API estivesse olhando outro banco, o teste poderia gravar no de desenvolvimento.
        string? effective = new NpgsqlConnectionStringBuilder(db.Database.GetConnectionString()).Database;
        string expected = new NpgsqlConnectionStringBuilder(ConnectionString).Database!;
        if (effective != expected)
        {
            throw new InvalidOperationException($"A API está apontada para '{effective}', não para '{expected}'.");
        }

        await db.Database.MigrateAsync();

        PasswordHash = scope.ServiceProvider.GetRequiredService<IPasswordHasher>().Hash($"it-{Guid.NewGuid():N}");
        DatabaseVersion = await DatabaseServer.VersionOfAsync(ConnectionString);
    }

    public async Task DisposeAsync()
    {
        Client.Dispose();
        await Factory.DisposeAsync();
        await Server.DropDatabaseAsync(ConnectionString);
        await Server.DisposeAsync();
    }
}

[CollectionDefinition(Name)]
public sealed class IntegrationCollection : ICollectionFixture<IntegrationFixture>
{
    public const string Name = "integration";
}
