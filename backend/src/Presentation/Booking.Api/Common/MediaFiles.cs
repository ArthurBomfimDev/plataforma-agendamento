using Booking.Infrastructure.Module.Media;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;

namespace Booking.Api.Common;

/// <summary>
/// Serve as imagens guardadas em disco em <c>/media/…</c> (ADR-023). Só WebP — o único formato que o sistema
/// grava —, com cache longo e imutável: os nomes são aleatórios e nunca reutilizados, então o arquivo de um nome não
/// muda nunca. Depois do CORS (o frontend roda em outra origem) e antes da autenticação: a mídia é pública.
/// </summary>
public static class MediaFiles
{
    private static readonly string _cacheControl = new CacheControlHeaderValue
    {
        Public = true,
        MaxAge = TimeSpan.FromDays(365),
        Extensions = { new NameValueHeaderValue("immutable") },
    }.ToString();

    public static IApplicationBuilder UseMediaFiles(this IApplicationBuilder app)
    {
        string root = app.ApplicationServices.GetRequiredService<IOptions<StorageOptions>>().Value.ResolvedRoot;
        Directory.CreateDirectory(root);

        var contentTypes = new FileExtensionContentTypeProvider();
        contentTypes.Mappings.Clear();
        contentTypes.Mappings[".webp"] = "image/webp";

        return app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(root),
            RequestPath = StorageOptions.RequestPath,
            ContentTypeProvider = contentTypes,
            ServeUnknownFileTypes = false,
            OnPrepareResponse = context =>
            {
                context.Context.Response.Headers.CacheControl = _cacheControl;
                context.Context.Response.Headers.XContentTypeOptions = "nosniff";
            },
        });
    }
}
