using System.Net;
using System.Text;
using Booking.Application.Contracts.Notifications;

namespace Booking.Application.Module.Notifications.Email;

/// <summary>Uma linha "rótulo: valor" do corpo, como "Quando: quinta, 30/10, 10:00".</summary>
public sealed record EmailDetail(string Label, string Value);

/// <summary>Botão principal do e-mail.</summary>
public sealed record EmailAction(string Label, string Url);

/// <summary>
/// HTML simples, com estilo inline e sem imagem externa (nada carrega de fora, nada rastreia a abertura), e a mesma
/// mensagem em texto. Todo texto que vem de fora (nome, motivo, endereço) passa por escape. Sem motor de templates
/// (decisões de 22/09, §6.2): um layout só.
/// </summary>
public static class EmailLayout
{
    // Paleta R5 (docs/design/eixo-paleta-tipografia.md): action/primary e textos.
    private const string _actionColor = "#2563EB";
    private const string _textColor = "#0F172A";
    private const string _mutedColor = "#475569";

    public static EmailMessage Build(
        NotificationSettings settings,
        string to,
        string? toName,
        string subject,
        string preheader,
        string heading,
        IReadOnlyList<string> paragraphs,
        IReadOnlyList<EmailDetail> details,
        EmailAction? action = null,
        EmailAttachment? attachment = null)
    {
        return new EmailMessage(
            to,
            toName,
            subject,
            preheader,
            Html(settings.BrandName, preheader, heading, toName, paragraphs, details, action),
            Text(settings.BrandName, heading, toName, paragraphs, details, action),
            attachment);
    }

    private static string Html(
        string brand, string preheader, string heading, string? toName, IReadOnlyList<string> paragraphs, IReadOnlyList<EmailDetail> details, EmailAction? action)
    {
        static string E(string value) => WebUtility.HtmlEncode(value);

        var html = new StringBuilder();
        html.Append("<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><title>").Append(E(heading)).Append("</title></head>");
        html.Append("<body style=\"margin:0;padding:24px;background:#F8FAFC;font-family:Arial,Helvetica,sans-serif;color:").Append(_textColor).Append(";\">");

        // Prévia: o texto que o leitor de e-mail mostra ao lado do assunto, escondido no corpo.
        html.Append("<div style=\"display:none;max-height:0;overflow:hidden;\">").Append(E(preheader)).Append("</div>");

        html.Append("<table role=\"presentation\" width=\"100%\" style=\"max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px;padding:24px;\"><tr><td>");
        html.Append("<p style=\"margin:0 0 16px;font-size:14px;font-weight:bold;color:").Append(_actionColor).Append(";\">").Append(E(brand)).Append("</p>");
        html.Append("<h1 style=\"margin:0 0 16px;font-size:20px;\">").Append(E(heading)).Append("</h1>");

        if (!string.IsNullOrWhiteSpace(toName))
        {
            html.Append("<p style=\"margin:0 0 12px;\">Olá, ").Append(E(toName)).Append(".</p>");
        }

        foreach (string paragraph in paragraphs)
        {
            html.Append("<p style=\"margin:0 0 12px;line-height:1.5;\">").Append(E(paragraph)).Append("</p>");
        }

        if (details.Count > 0)
        {
            html.Append("<table role=\"presentation\" style=\"margin:8px 0 16px;border-collapse:collapse;\">");
            foreach (EmailDetail detail in details)
            {
                html.Append("<tr><td style=\"padding:4px 12px 4px 0;color:").Append(_mutedColor).Append(";vertical-align:top;\">")
                    .Append(E(detail.Label)).Append("</td><td style=\"padding:4px 0;\">").Append(E(detail.Value)).Append("</td></tr>");
            }

            html.Append("</table>");
        }

        if (action is not null)
        {
            html.Append("<p style=\"margin:16px 0;\"><a href=\"").Append(E(action.Url))
                .Append("\" style=\"display:inline-block;padding:12px 20px;border-radius:8px;background:").Append(_actionColor)
                .Append(";color:#FFFFFF;text-decoration:none;font-weight:bold;\">").Append(E(action.Label)).Append("</a></p>");
            html.Append("<p style=\"margin:0 0 12px;font-size:12px;color:").Append(_mutedColor).Append(";\">Se o botão não abrir, copie este endereço: ")
                .Append(E(action.Url)).Append("</p>");
        }

        html.Append("<p style=\"margin:24px 0 0;font-size:12px;color:").Append(_mutedColor).Append(";\">Mensagem automática de ")
            .Append(E(brand)).Append(". Não responda a este e-mail.</p>");
        html.Append("</td></tr></table></body></html>");
        return html.ToString();
    }

    private static string Text(
        string brand, string heading, string? toName, IReadOnlyList<string> paragraphs, IReadOnlyList<EmailDetail> details, EmailAction? action)
    {
        var text = new StringBuilder();
        text.AppendLine(heading).AppendLine();

        if (!string.IsNullOrWhiteSpace(toName))
        {
            text.Append("Olá, ").Append(toName).AppendLine(".").AppendLine();
        }

        foreach (string paragraph in paragraphs)
        {
            text.AppendLine(paragraph).AppendLine();
        }

        foreach (EmailDetail detail in details)
        {
            text.Append(detail.Label).Append(": ").AppendLine(detail.Value);
        }

        if (details.Count > 0)
        {
            text.AppendLine();
        }

        if (action is not null)
        {
            text.Append(action.Label).Append(": ").AppendLine(action.Url).AppendLine();
        }

        text.Append("Mensagem automática de ").Append(brand).AppendLine(". Não responda a este e-mail.");
        return text.ToString();
    }
}
