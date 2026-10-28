namespace Booking.Application.Module.Notifications.Email;

/// <param name="BrandName">Nome da marca nos textos (<c>App__BrandName</c>, padrão Vagoo): trocar de nome não muda código.</param>
/// <param name="PublicBaseUrl">Endereço público do frontend (<c>App__PublicBaseUrl</c>), para montar os links.</param>
public sealed record NotificationSettings(string BrandName, string PublicBaseUrl)
{
    /// <summary>Link para uma rota do frontend (HashRouter): <c>{base}/#/{rota}</c>.</summary>
    public string Link(string route) => $"{PublicBaseUrl.TrimEnd('/')}/#/{route.TrimStart('/')}";
}
