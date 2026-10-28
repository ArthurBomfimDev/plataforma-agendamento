using System.Security.Cryptography;
using Booking.Api.Common;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Booking.IntegrationTests.Infrastructure;

/// <summary>
/// A API real, em processo, apontada para o banco isolado da execução. Nada de <c>Program.cs</c> muda:
/// o limitador de autenticação continua ligado, e os testes simplesmente não passam por ele em massa.
/// </summary>
/// <param name="logs">Captura opcional do log de uma categoria, com o nível dela aberto até Debug.</param>
public sealed class BookingApiFactory(string connectionString, string environment = "Testing", LogCapture? logs = null)
    : WebApplicationFactory<Program>
{
    // Chave de assinatura gerada a cada execução: valor de teste, nunca gravado em arquivo.
    private readonly string _signingKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    public string ConnectionString => connectionString;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Padrão fora de Development: sem user-secrets da máquina de quem roda o teste. Os testes de segurança
        // sobem também em Development, que é como o docker compose roda.
        builder.UseEnvironment(environment);
        builder.UseSetting("ConnectionStrings:Default", connectionString);
        builder.UseSetting("Jwt:SigningKey", _signingKey);

        // Cada 409 da corrida é um INSERT recusado pela constraint, que o EF registra como erro: 980 por execução
        // do A2. São falhas esperadas, conferidas pelas asserções; no log só escondem o que importa.
        builder.UseSetting("Logging:LogLevel:Microsoft.EntityFrameworkCore.Database.Command", "None");
        builder.UseSetting("Logging:LogLevel:Microsoft.EntityFrameworkCore.Update", "None");

        if (logs is not null)
        {
            // Debug aberto de propósito: se algo fosse escrito em Debug, a captura veria.
            builder.UseSetting($"Logging:LogLevel:{logs.CategoryPrefix}", "Debug");
            builder.ConfigureLogging(logging => logging.AddProvider(logs));
        }

        builder.ConfigureServices(services =>
        {
            // O worker expira pedidos pendentes a cada minuto; no meio de um teste, mudaria o resultado.
            ServiceDescriptor worker = services.Single(d =>
                d.ServiceType == typeof(IHostedService) && d.ImplementationType == typeof(PendingExpirationWorker));
            services.Remove(worker);
        });
    }
}
