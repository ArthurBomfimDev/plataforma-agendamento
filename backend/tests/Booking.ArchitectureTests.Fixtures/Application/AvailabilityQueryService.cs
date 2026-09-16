namespace Booking.Application.Module.Availability;

public sealed class HolidayQueryService
{
    /// <summary>✗ Decisão 4 — *QueryService fora de Queries/ também é superfície de consulta.</summary>
    public IEnumerable<string> ListNames() => [];
}
