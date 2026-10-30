using Booking.Application.Contracts.Identity;
using Booking.Domain.Exceptions;

namespace Booking.Application.Module.Identity.Commands;

internal static class PasswordRules
{
    public static void Ensure(string? password)
    {
        if (string.IsNullOrEmpty(password)
            || password.Length < IdentityPolicy.MinPasswordLength
            || password.Length > IdentityPolicy.MaxPasswordLength)
        {
            throw new DomainException("user.password_invalid_length");
        }
    }
}
