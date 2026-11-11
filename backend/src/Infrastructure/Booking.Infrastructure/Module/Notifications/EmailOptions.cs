namespace Booking.Infrastructure.Module.Notifications;

/// <summary>
/// <c>Email__Smtp__Host</c>, <c>Port</c>, <c>User</c>, <c>Password</c>, <c>UseSsl</c>, <c>Email__From</c>,
/// <c>Email__FromName</c>. Credencial só por variável de ambiente ou user-secrets, nunca no repositório.
/// </summary>
public sealed class EmailOptions
{
    public const string SectionName = "Email";

    public SmtpOptions Smtp { get; set; } = new();
    public string? From { get; set; }
    public string? FromName { get; set; }
}

public sealed class SmtpOptions
{
    public string? Host { get; set; }
    public int Port { get; set; }
    public string? User { get; set; }
    public string? Password { get; set; }

    /// <summary>Com TLS: implícito na 465, STARTTLS obrigatório nas demais. Sem: texto puro (só o Mailpit local).</summary>
    public bool UseSsl { get; set; }

    /// <summary>
    /// Consulta CRL/OCSP ao validar o certificado do servidor (<c>Email__Smtp__CheckCertificateRevocation</c>, padrão
    /// <c>true</c>). Em <c>false</c> a cadeia e o nome do servidor continuam validados; só a consulta de revogação é
    /// dispensada. Para ambiente cuja saída não alcança a CRL (ADR-021).
    /// </summary>
    public bool CheckCertificateRevocation { get; set; } = true;
}

/// <summary><c>App__PublicBaseUrl</c> (links dos e-mails) e <c>App__BrandName</c> (padrão Vagoo).</summary>
public sealed class AppOptions
{
    public const string SectionName = "App";
    public const string DefaultBrandName = "Vagoo";

    public string? PublicBaseUrl { get; set; }
    public string BrandName { get; set; } = DefaultBrandName;
}
