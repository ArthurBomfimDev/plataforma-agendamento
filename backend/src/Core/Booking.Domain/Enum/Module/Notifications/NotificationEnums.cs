namespace Booking.Domain.Enum.Module.Notifications;

/// <summary>Quem lê o aviso: o consumidor (no app do consumidor) ou a equipe (no painel de um estabelecimento).</summary>
public enum NotificationAudience
{
    Customer,
    Business,
}

public enum NotificationType
{
    RequestReceived,
    Confirmed,
    Rejected,
    CancelledByBusiness,
    CancelledByCustomer,
    Expired,
    ReviewInvite,
    ReminderDayBefore,
    ReminderHourBefore,
}
