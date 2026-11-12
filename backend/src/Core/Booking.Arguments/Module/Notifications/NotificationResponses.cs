namespace Booking.Arguments.Module.Notifications;

public sealed record NotificationResponse(
    Guid Id,
    string Type,
    string Title,
    string Body,
    Guid? AppointmentId,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReadAt);

public sealed record UnreadCountResponse(int Count);
