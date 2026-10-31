using Booking.Domain.Exceptions;

namespace Booking.Domain.ValueObject;

/// <summary>Intervalo meio-aberto <c>[Start, End)</c>: 13:00–14:00 e 14:00–15:00 não se sobrepõem.</summary>
public sealed record TimeRange
{
    public DateTimeOffset Start { get; }
    public DateTimeOffset End { get; }

    private TimeRange(DateTimeOffset start, DateTimeOffset end)
    {
        Start = start;
        End = end;
    }

    public static TimeRange Of(DateTimeOffset start, DateTimeOffset end)
    {
        if (end <= start)
        {
            throw new DomainException("time_range.end_before_start");
        }

        return new TimeRange(start.ToUniversalTime(), end.ToUniversalTime());
    }

    public bool Overlaps(TimeRange other) => Start < other.End && other.Start < End;

    public bool Contains(TimeRange other) => Start <= other.Start && other.End <= End;
}
