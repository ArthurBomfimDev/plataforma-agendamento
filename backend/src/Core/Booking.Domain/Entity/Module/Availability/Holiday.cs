using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Availability;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.Availability;

public sealed class Holiday : BaseEntity
{
    public DateOnly Date { get; private  set; }
    public string Name { get; private set; } = null!;
    public HolidayKind Kind { get; private set; }

    private  Holiday()
    {
    }

    public static Holiday Create(DateOnly date, string name, HolidayKind kind)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("holiday.name_required");
        }

        return new Holiday { Date = date, Name = name.Trim(), Kind = kind };
    }
}
