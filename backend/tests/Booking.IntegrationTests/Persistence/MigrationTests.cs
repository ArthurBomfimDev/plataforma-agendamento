using Booking.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;

namespace Booking.IntegrationTests.Persistence;

/// <summary>
/// Migration só aditiva: sobe num banco vazio (a fixture já faz isso a cada execução) e sobe num banco que já
/// está na migration anterior, com dado, sem perder nem mudar o que existia.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class MigrationTests(IntegrationFixture fixture)
{
    private const string _beforePlatformAdmin = "20261014032556_AddCoreModules";

    [Fact]
    public async Task AddPlatformAdmin_upgrades_a_database_with_existing_accounts()
    {
        string database = await fixture.Server.CreateDatabaseAsync();
        try
        {
            await using (var direct = new DirectDbContext(database))
            {
                await direct.Db.GetService<IMigrator>().MigrateAsync(_beforePlatformAdmin);
            }

            Guid existing = Guid.CreateVersion7();
            await ExecuteAsync(database, """
                INSERT INTO identity."user" (id, email, password_hash, full_name, status, created_at)
                VALUES (@id, 'antes@exemplo.test', 'hash-de-teste', 'Conta anterior', 'Active', now())
                """, ("id", existing));

            await using (var direct = new DirectDbContext(database))
            {
                await direct.Db.Database.MigrateAsync();
                Assert.Empty(await direct.Db.Database.GetPendingMigrationsAsync());
            }

            Assert.Equal(1L, await ScalarAsync(database,
                "SELECT count(*) FROM identity.\"user\" WHERE id = @id AND email = 'antes@exemplo.test' AND NOT is_platform_admin",
                ("id", existing)));
        }
        finally
        {
            await fixture.Server.DropDatabaseAsync(database);
        }
    }

    private static async Task ExecuteAsync(string connectionString, string sql, params (string Name, object Value)[] parameters)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        foreach ((string name, object value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        await command.ExecuteNonQueryAsync();
    }

    private static async Task<long> ScalarAsync(string connectionString, string sql, params (string Name, object Value)[] parameters)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        foreach ((string name, object value) in parameters)
        {
            command.Parameters.AddWithValue(name, value);
        }

        return Convert.ToInt64(await command.ExecuteScalarAsync());
    }
}
