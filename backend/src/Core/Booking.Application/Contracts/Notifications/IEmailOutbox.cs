namespace Booking.Application.Contracts.Notifications;

/// <summary>Anexo de texto. Hoje, só o <c>.ics</c> da confirmação.</summary>
public sealed record EmailAttachment(string FileName, string ContentType, string Content);

/// <summary>
/// E-mail já montado, com versão em HTML e em texto. <c>Preheader</c> é a prévia que o leitor de e-mail mostra
/// ao lado do assunto — em Saúde, nem ele nem o assunto citam serviço ou categoria (LGPD, Art. 11; ADR-021).
/// </summary>
public sealed record EmailMessage(
    string To,
    string? ToName,
    string Subject,
    string Preheader,
    string HtmlBody,
    string TextBody,
    EmailAttachment? Attachment = null);

/// <summary>
/// Põe um e-mail na outbox, rastreado pelo mesmo <c>DbContext</c> da requisição: ele é gravado no mesmo
/// <c>SaveChanges</c> do fato que o gerou, ou não é gravado. Nunca envia nada.
/// </summary>
public interface IEmailOutbox
{
    void Enqueue(EmailMessage message);
}
