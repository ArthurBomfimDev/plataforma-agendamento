using Booking.Domain.Exceptions;

namespace Booking.Domain.ValueObject;

public sealed record GeoPoint
{
    public double Latitude { get; }
    public double Longitude { get; }

    private GeoPoint(double latitude, double longitude)
    {
        Latitude = latitude;
        Longitude = longitude;
    }

    public static GeoPoint Of(double latitude, double longitude)
    {
        if (latitude is < -90 or > 90)
        {
            throw new DomainException("geo_point.invalid_latitude");
        }

        if (longitude is < -180 or > 180)
        {
            throw new DomainException("geo_point.invalid_longitude");
        }

        return new GeoPoint(latitude, longitude);
    }
}
