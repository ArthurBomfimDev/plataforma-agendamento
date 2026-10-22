namespace Booking.Domain.Enum.Module.Tenancy;

public enum BusinessCategory
{
    Beleza,
    Saude,
}

public static class BusinessCategoryExtensions
{
    public static bool RequiresSensitiveHandling(this BusinessCategory category) =>
        category == BusinessCategory.Saude;
}
