using Npgsql;
using Testcontainers.PostgreSql;

namespace Booking.IntegrationTests.Infrastructure;

/// <summary>
/// Servidor PostgreSQL dos testes. O teste nunca toca o banco de desenvolvimento: cada execução cria bancos
/// próprios (<c>booking_it_&lt;guid&gt;</c>) e os apaga no fim.
/// </summary>
/// <remarks>
/// Com <c>ConnectionStrings__Default</c> definida (o CI define, com PostGIS e btree_gist no serviço), usa esse
/// servidor só para criar bancos novos. Sem ela, sobe <c>postgis/postgis:17-3.5</c> por Testcontainers.
/// </remarks>
public sealed class DatabaseServer : IAsyncDisposable
{
    public const string PostgisImage = "postgis/postgis:17-3.5";

    private readonly PostgreSqlContainer? _container;
    private readonly string _adminConnectionString;

    private DatabaseServer(string adminConnectionString, PostgreSqlContainer? container)
    {
        _adminConnectionString = adminConnectionString;
        _container = container;
    }

    /// <summary>"CI (ConnectionStrings__Default)" ou "Testcontainers (postgis/postgis:17-3.5)" — vai para a evidência.</summary>
    public string Origin => _container is null ? "ConnectionStrings__Default" : $"Testcontainers ({PostgisImage})";

    public static async Task<DatabaseServer> StartAsync()
    {
        string? configured = Environment.GetEnvironmentVariable("ConnectionStrings__Default");

        if (!string.IsNullOrWhiteSpace(configured))
        {
            return new DatabaseServer(configured, null);
        }

        PostgreSqlContainer container = new PostgreSqlBuilder(PostgisImage).Build();

        await container.StartAsync();
        return new DatabaseServer(container.GetConnectionString(), container);
    }

    /// <summary>Cria um banco vazio com as extensões que a migration exige e devolve a connection string dele.</summary>
    public async Task<string> CreateDatabaseAsync()
    {
        string name = $"booking_it_{Guid.NewGuid():N}";

        await using (var admin = new NpgsqlConnection(_adminConnectionString))
        {
            await admin.OpenAsync();
            await using NpgsqlCommand create = new($"CREATE DATABASE \"{name}\"", admin);
            await create.ExecuteNonQueryAsync();
        }

        string connectionString = new NpgsqlConnectionStringBuilder(_adminConnectionString)
        {
            Database = name,
            // 50 requisições simultâneas, cada uma com a sua conexão, mais folga para as consultas do teste.
            MaxPoolSize = 200,
        }.ConnectionString;

        await using (var database = new NpgsqlConnection(connectionString))
        {
            await database.OpenAsync();
            await using NpgsqlCommand extensions = new(
                "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS btree_gist;", database);
            await extensions.ExecuteNonQueryAsync();
        }

        return connectionString;
    }

    public async Task DropDatabaseAsync(string connectionString)
    {
        string name = new NpgsqlConnectionStringBuilder(connectionString).Database!;

        NpgsqlConnection.ClearAllPools();

        await using var admin = new NpgsqlConnection(_adminConnectionString);
        await admin.OpenAsync();
        await using NpgsqlCommand drop = new($"DROP DATABASE IF EXISTS \"{name}\" WITH (FORCE)", admin);
        await drop.ExecuteNonQueryAsync();
    }

    /// <summary>Versão do PostgreSQL e do PostGIS de um banco criado por <see cref="CreateDatabaseAsync"/>.</summary>
    public static async Task<string> VersionOfAsync(string connectionString)
    {
        await using var database = new NpgsqlConnection(connectionString);
        await database.OpenAsync();
        await using NpgsqlCommand version = new("SELECT version() || ' | PostGIS ' || postgis_lib_version()", database);
        return (string)(await version.ExecuteScalarAsync())!;
    }

    public async ValueTask DisposeAsync()
    {
        if (_container is not null)
        {
            await _container.DisposeAsync();
        }
    }
}
