namespace Booking.Application.Module.Notifications.Email;

/// <param name="BrandName">Nome da marca nos textos (<c>App__BrandName</c>, padrão Vagoo): trocar de nome não muda código.</param>
/// <param name="PublicBaseUrl">Endereço público do frontend (<c>App__PublicBaseUrl</c>), para montar os links.</param>
/// <param name="ReminderDailyEmailBudget">
/// Teto de e-mails nas últimas 24 h <b>para os lembretes pararem</b> (<c>App__ReminderDailyEmailBudget</c>, padrão 400). Só
/// o lembrete consulta este número: confirmação, redefinição de senha e todo o resto enviam sempre. A folga até o limite do
/// provedor (Gmail: cerca de 500 por dia, a conferir) fica reservada para eles.
/// </param>
public sealed record NotificationSettings(string BrandName, string PublicBaseUrl, int ReminderDailyEmailBudget = 400)
{
    /// <summary>Link para uma rota do frontend (HashRouter): <c>{base}/#/{rota}</c>.</summary>
    public string Link(string route) => $"{PublicBaseUrl.TrimEnd('/')}/#/{route.TrimStart('/')}";
}
