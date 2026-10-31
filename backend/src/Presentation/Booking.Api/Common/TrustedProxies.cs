using System.Net;
using Microsoft.AspNetCore.HttpOverrides;

namespace Booking.Api.Common;

/// <summary>
/// A API atrás do nginx (e, na demonstração pública, do Cloudflare Tunnel). Sem isto, o IP de quem chama seria sempre o
/// do nginx, e o limitador de força bruta (10 por minuto por IP) trataria todo mundo como uma pessoa só.
/// </summary>
/// <remarks>
/// Só se confia em <c>X-Forwarded-For</c> e <c>X-Forwarded-Proto</c> vindos das redes em
/// <c>ForwardedHeaders:KnownNetworks</c> (CIDR) e dos IPs em <c>ForwardedHeaders:KnownProxies</c>. Sem configuração,
/// vale o padrão do ASP.NET: só o loopback. A cadeia é lida da direita para a esquerda e para no primeiro IP que não é
/// de confiança: esse é o de quem chamou. Um <c>X-Forwarded-For</c> inventado pelo navegador fica à esquerda dele e é
/// ignorado.
/// </remarks>
public static class TrustedProxies
{
    public const string SectionName = "ForwardedHeaders";

    public static IServiceCollection AddTrustedProxies(this IServiceCollection services, IConfiguration configuration)
    {
        string[] networks = configuration.GetSection($"{SectionName}:KnownNetworks").Get<string[]>() ?? [];
        string[] proxies = configuration.GetSection($"{SectionName}:KnownProxies").Get<string[]>() ?? [];

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

            // Sem limite fixo de saltos: o túnel e o nginx são dois, e o laço para sozinho no primeiro IP desconhecido.
            options.ForwardLimit = null;

            foreach (string network in networks.Where(n => !string.IsNullOrWhiteSpace(n)))
            {
                options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(network.Trim()));
            }

            foreach (string proxy in proxies.Where(p => !string.IsNullOrWhiteSpace(p)))
            {
                options.KnownProxies.Add(IPAddress.Parse(proxy.Trim()));
            }
        });

        return services;
    }
}
