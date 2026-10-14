using Booking.Application.Contracts.Catalog.Planted;
using Booking.Domain.Entity.Module.Catalog.Planted;

namespace Booking.Application.Module.Scheduling.Commands;

/// <summary>✗ Decisão 1 — o Scheduling lê a entidade interna do Catalog direto.</summary>
public sealed class ConfirmAppointmentReadingCatalogInternals(Service service)
{
    public Service Service { get; } = service;
}

/// <summary>✓ Decisão 1 — o Scheduling consulta o Catalog pelo contrato público.</summary>
public sealed class RequestAppointmentThroughCatalogContract(IServiceCatalog catalog)
{
    public IServiceCatalog Catalog { get; } = catalog;
}
