using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Exceptions;
using Booking.Domain.ValueObject;

namespace Booking.Domain.Entity.Module.Identity;

public sealed class User : AggregateRoot, IAuditable
{
    public Email Email { get; private set; } = null!;
    public string PasswordHash { get; private set; } = null!;
    public string FullName { get; private set; } = null!;
    public DateTimeOffset? EmailConfirmedAt { get; private set; }
    public UserStatus Status { get; private set; }

    private User()
    {
    }

    public static User Create(Email email, string passwordHash, string fullName)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new DomainException("user.password_hash_required");
        }

        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new DomainException("user.full_name_required");
        }

        return new User
        {
            Email = email,
            PasswordHash = passwordHash,
            FullName = fullName.Trim(),
            Status = UserStatus.Active,
        };
    }

    public void ConfirmEmail(DateTimeOffset now)
    {
        if (Status == UserStatus.Deleted)
        {
            throw new DomainException("user.cannot_confirm_deleted");
        }

        EmailConfirmedAt = now;
    }

    public void ChangePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
        {
            throw new DomainException("user.password_hash_required");
        }

        PasswordHash = newPasswordHash;
    }

    public void Suspend()
    {
        if (Status == UserStatus.Deleted)
        {
            throw new DomainException("user.cannot_suspend_deleted");
        }

        Status = UserStatus.Suspended;
    }

    public void Deactivate()
    {
        if (Status == UserStatus.Deleted)
        {
            throw new DomainException("user.cannot_deactivate_deleted");
        }

        Status = UserStatus.Inactive;
    }

    public void Reactivate()
    {
        if (Status != UserStatus.Inactive)
        {
            throw new DomainException("user.not_inactive");
        }

        Status = UserStatus.Active;
    }
}
