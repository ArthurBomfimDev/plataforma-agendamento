namespace Booking.Domain.Exceptions;

public sealed class DomainException(string code) : System.Exception(code)
{
    public string Code { get; } = code;
}
