using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Notifications;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.Notifications;

/// <summary>
/// Aviso dentro do aplicativo (o sino). É da pessoa (<see cref="UserId"/>) e de um lado só: do consumidor ou de um
/// estabelecimento, porque a mesma conta troca de contexto e não deve ver, no app do consumidor, o pedido que chegou ao
/// painel. Não é por tenant: quem lê é sempre o próprio dono do aviso.
/// </summary>
/// <remarks>
/// O texto já nasce pronto e, em categoria de saúde, sem serviço nem nome do estabelecimento (LGPD, Art. 11), como o assunto do
/// e-mail: a lista do sino também aparece na tela de quem estiver olhando o aparelho.
/// </remarks>
public sealed class Notification : BaseEntity, IAuditable
{
    public const int MaxTitleLength = 200;
    public const int MaxBodyLength = 400;

    public Guid UserId { get; private set; }
    public NotificationAudience Audience { get; private set; }

    /// <summary>Só no lado do estabelecimento: de qual deles é o aviso.</summary>
    public Guid? BusinessId { get; private set; }

    public NotificationType Type { get; private set; }
    public Guid? AppointmentId { get; private set; }
    public string Title { get; private set; } = null!;
    public string Body { get; private set; } = null!;
    /// <summary>Quando o aviso foi criado; a lista ordena e mostra por ela (a coluna de auditoria é sombra).</summary>
    public DateTimeOffset OccurredAt { get; private set; }

    public DateTimeOffset? ReadAt { get; private set; }

    private Notification()
    {
    }

    public static Notification Create(
        Guid userId, NotificationAudience audience, Guid? businessId, NotificationType type, Guid? appointmentId, string title, string body, DateTimeOffset now)
    {
        if (audience == NotificationAudience.Business && businessId is null)
        {
            throw new DomainException("notification.business_required");
        }

        return new Notification
        {
            UserId = userId,
            Audience = audience,
            BusinessId = audience == NotificationAudience.Business ? businessId : null,
            Type = type,
            AppointmentId = appointmentId,
            Title = Truncate(title, MaxTitleLength),
            Body = Truncate(body, MaxBodyLength),
            OccurredAt = now,
        };
    }

    public bool IsRead => ReadAt is not null;

    /// <summary>Marcar de novo não muda a hora: o que vale é a primeira leitura.</summary>
    public void MarkRead(DateTimeOffset now) => ReadAt ??= now;

    private static string Truncate(string text, int max) => text.Length <= max ? text : text[..(max - 1)] + "…";
}
