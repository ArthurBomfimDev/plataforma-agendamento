using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.ValueObject;

namespace Booking.UnitTests.Identity;

public sealed class UserDomainTests
{
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("sem-arroba")]
    public void Email_rejects_invalid_input(string input)
    {
        Assert.Throws<DomainException>(() => Email.Of(input));
    }

    [Fact]
    public void Email_is_normalized_and_compared_by_value()
    {
        Assert.Equal(Email.Of("ANA@Exemplo.com "), Email.Of("ana@exemplo.com"));
    }

    [Fact]
    public void Deleted_user_cannot_be_reactivated_confirmed_or_suspended()
    {
        User user = User.Create(Email.Of("a@b.com"), "hash", "A");
        typeof(User).GetProperty(nameof(User.Status))!.SetValue(user, UserStatus.Deleted);

        Assert.Throws<DomainException>(() => user.ConfirmEmail(DateTimeOffset.UtcNow));
        Assert.Throws<DomainException>(user.Suspend);
        Assert.Throws<DomainException>(user.Reactivate);
    }

    [Fact]
    public void Used_or_expired_user_token_cannot_be_consumed_again()
    {
        DateTimeOffset now = DateTimeOffset.UtcNow;
        UserToken token = UserToken.Issue(Guid.CreateVersion7(), UserTokenType.PasswordReset, "h", now.AddHours(1));

        token.MarkAsUsed(now);

        Assert.Throws<DomainException>(() => token.MarkAsUsed(now));
        Assert.Throws<DomainException>(() =>
            UserToken.Issue(Guid.CreateVersion7(), UserTokenType.PasswordReset, "h", now.AddHours(1)).MarkAsUsed(now.AddHours(2)));
    }
}
