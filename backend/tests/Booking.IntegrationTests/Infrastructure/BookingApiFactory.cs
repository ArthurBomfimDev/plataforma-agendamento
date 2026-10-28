using System.Security.Cryptography;
using Booking.Api.Common;
using Booking.Application.Module.Notifications.Email;
using Booking.Infrastructure.Module.Tenancy.Geo;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Booking.IntegrationTests.Infrastructure;

/// <summary>
/// A API real, em processo, apontada para o banco isolado da execução. Nada de <c>Program.cs</c> muda:
/// o limitador de autenticação continua ligado, e os testes simplesmente não passam por ele em massa.
/// </summary>
/// <param name="logs">Captura opcional do log de uma categoria, com o nível dela aberto até Debug.</param>
/// <param name="configureEmail">
/// Falso só no teste que prova que a API não sobe sem SMTP fora de Development. Nos demais, um SMTP fictício
/// (<c>smtp.invalid</c>) satisfaz a validação e o envio vai para o <see cref="FakeEmailSender"/>.
/// </param>
/// <param name="settings">Configuração extra desta instância, por exemplo <c>Identity:RequireEmailConfirmation</c>.</param>
public sealed class BookingApiFactory(
    string connectionString,
    string environment = "Testing",
    LogCapture? logs = null,
    bool configureEmail = true,
    IReadOnlyDictionary<string, string>? settings = null)
    : WebApplicationFactory<Program>
{
    // Chave de assinatura gerada a cada execução: valor de teste, nunca gravado em arquivo.
    private readonly string _signingKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    public string ConnectionString => connectionString;

    /// <summary>O canal falso desta instância da API: o que ela teria enviado por e-mail.</summary>
    public FakeEmailSender Emails { get; } = new();

    /// <summary>O lado de fora dos provedores de localização desta instância. Sem resposta configurada, recusa.</summary>
    public FakeGeoHttp Geo { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Padrão fora de Development: sem user-secrets da máquina de quem roda o teste. Os testes de segurança
        // sobem também em Development, que é como o docker compose roda.
        builder.UseEnvironment(environment);
        builder.UseSetting("ConnectionStrings:Default", connectionString);
        builder.UseSetting("Jwt:SigningKey", _signingKey);

        if (configureEmail)
        {
            // .invalid é reservado (RFC 2606): mesmo que algo tentasse, não resolveria. O envio vai para o canal falso.
            builder.UseSetting("Email:Smtp:Host", "smtp.invalid");
            builder.UseSetting("Email:From", "nao-responda@exemplo.test");
            builder.UseSetting("Email:FromName", "Vagoo de teste");
            builder.UseSetting("App:PublicBaseUrl", "http://app.exemplo.test");
        }

        // Sem a espera de 1 s entre chamadas ao Nominatim: o intervalo tem teste próprio (unitário).
        builder.UseSetting("Geo:Nominatim:MinIntervalMilliseconds", "0");

        foreach ((string key, string value) in settings ?? new Dictionary<string, string>())
        {
            builder.UseSetting(key, value);
        }

        // Cada 409 da corrida é um INSERT recusado pela constraint, que o EF registra como erro: 980 por execução
        // do A2. São falhas esperadas, conferidas pelas asserções; no log só escondem o que importa.
        builder.UseSetting("Logging:LogLevel:Microsoft.EntityFrameworkCore.Database.Command", "None");
        builder.UseSetting("Logging:LogLevel:Microsoft.EntityFrameworkCore.Update", "None");

        if (logs is not null)
        {
            // Debug aberto de propósito: se algo fosse escrito em Debug, a captura veria. Prefixo vazio = tudo.
            builder.UseSetting(
                logs.CategoryPrefix.Length == 0 ? "Logging:LogLevel:Default" : $"Logging:LogLevel:{logs.CategoryPrefix}", "Debug");
            builder.ConfigureLogging(logging => logging.AddProvider(logs));
        }

        builder.ConfigureServices(services =>
        {
            // Os workers rodariam no meio de um teste e mudariam o resultado: o de expiração expira pedidos, o da
            // outbox envia e-mail. Os testes chamam os comandos deles quando querem.
            foreach (Type worker in new[] { typeof(PendingExpirationWorker), typeof(OutboxWorker) })
            {
                services.Remove(services.Single(d => d.ServiceType == typeof(IHostedService) && d.ImplementationType == worker));
            }

            services.RemoveAll<IEmailSender>();
            services.AddSingleton<IEmailSender>(Emails);

            // Os adaptadores de localização rodam de verdade, com a rede trocada pelo FakeGeoHttp.
            services.AddHttpClient<NominatimGeocodingProvider>().ConfigurePrimaryHttpMessageHandler(Geo.CreateHandler);
            services.AddHttpClient<BrasilApiPostalCodeLookup>().ConfigurePrimaryHttpMessageHandler(Geo.CreateHandler);
            services.AddHttpClient<ViaCepPostalCodeLookup>().ConfigurePrimaryHttpMessageHandler(Geo.CreateHandler);
        });
    }
}
