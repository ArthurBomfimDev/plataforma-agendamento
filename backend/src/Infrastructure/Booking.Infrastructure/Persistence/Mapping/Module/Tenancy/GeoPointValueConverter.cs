using Booking.Domain.ValueObject;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NetTopologySuite.Geometries;

namespace Booking.Infrastructure.Persistence.Mapping.Module.Tenancy;

public sealed class GeoPointValueConverter() : ValueConverter<GeoPoint?, Point?>(
    point => point == null ? null : new Point(point.Longitude, point.Latitude) { SRID = 4326 },
    geom => geom == null ? null : GeoPoint.Of(geom.Y, geom.X));
