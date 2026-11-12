using Booking.Application.Module.Notifications.Commands;
using Booking.Domain.Entity.Module.Notifications;
using Booking.Domain.Enum.Module.Notifications;
using Booking.Domain.Exceptions;
using Booking.UnitTests.Identity;

namespace Booking.UnitTests.Notifications;

public sealed class NotificationTests
{
    private static readonly DateTimeOffset _now = new(2026, 11, 11, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void A_customer_notification_has_no_business_even_if_one_is_passed()
    {
        Notification n = Notification.Create(Guid.CreateVersion7(), NotificationAudience.Customer, Guid.CreateVersion7(), NotificationType.Confirmed, null, "t", "b", _now);

        Assert.Null(n.BusinessId);
        Assert.False(n.IsRead);
        Assert.Equal(_now, n.OccurredAt);
    }

    [Fact]
    public async Task Purge_keeps_read_notices_30_days_and_unread_90()
    {
        var repository = new FakeNotificationRepository();

        await new PurgeOldNotificationsCommand(repository, new MutableClock(_now)).ExecuteAsync();

        Assert.Equal((_now.AddDays(-30), _now.AddDays(-90)), repository.Purged);
    }

    [Fact]
    public void A_business_notification_needs_the_business()
    {
        DomainException e = Assert.Throws<DomainException>(() =>
            Notification.Create(Guid.CreateVersion7(), NotificationAudience.Business, null, NotificationType.RequestReceived, null, "t", "b", _now));

        Assert.Equal("notification.business_required", e.Code);
    }

    [Fact]
    public void Reading_twice_keeps_the_first_read_time()
    {
        Notification n = Notification.Create(Guid.CreateVersion7(), NotificationAudience.Customer, null, NotificationType.Confirmed, null, "t", "b", _now);

        n.MarkRead(_now);
        n.MarkRead(_now.AddHours(1));

        Assert.True(n.IsRead);
        Assert.Equal(_now, n.ReadAt);
    }

    [Fact]
    public void Long_text_is_cut_to_the_column_size()
    {
        Notification n = Notification.Create(
            Guid.CreateVersion7(), NotificationAudience.Customer, null, NotificationType.Confirmed, null,
            new string('a', 500), new string('b', 900), _now);

        Assert.Equal(Notification.MaxTitleLength, n.Title.Length);
        Assert.Equal(Notification.MaxBodyLength, n.Body.Length);
        Assert.EndsWith("…", n.Title);
    }
}
