namespace Booking.Api.Common;

/// <summary>
/// Cabeçalhos de segurança de uma API que só devolve JSON (RNF-06). Nada aqui é renderizado num navegador, então
/// a política é a mais fechada: sem sniffing de tipo, sem moldura, sem referer, sem recurso carregado.
/// </summary>
/// <remarks>HSTS fica no <c>Program</c> (<c>UseHsts</c>), fora de Development: só vale sobre HTTPS.</remarks>
public static class SecurityHeaders
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app) =>
        app.Use(async (context, next) =>
        {
            // Na hora de enviar, e não antes: o tratamento de erro limpa os cabeçalhos da resposta, e um 500
            // também precisa deles.
            context.Response.OnStarting(() =>
            {
                IHeaderDictionary headers = context.Response.Headers;
                headers.XContentTypeOptions = "nosniff";
                headers.XFrameOptions = "DENY";
                headers["Referrer-Policy"] = "no-referrer";
                headers.ContentSecurityPolicy = "default-src 'none'; frame-ancestors 'none'";
                return Task.CompletedTask;
            });

            await next(context);
        });
}
