using System.Net.Mail;
using Booking.Domain.Exceptions;

namespace Booking.Domain.ValueObject;

public sealed record Email
{
    public string Address { get; }
    private Email(string address)
    {
        Address = address;
    }

    public static Email Of(string address)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            throw new DomainException("email.required");
        }

        string normalized = address.Trim().ToLowerInvariant();

        if (!MailAddress.TryCreate(normalized, out _))
        {
            throw new DomainException("email.invalid_format");
        }

        return new Email(normalized);
    }

    public override string ToString()
    {
        return Address;
    }
}
