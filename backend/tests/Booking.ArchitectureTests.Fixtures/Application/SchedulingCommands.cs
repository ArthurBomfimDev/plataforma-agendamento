using Booking.Application.Contracts.Catalog;
using Booking.Domain.Module.Catalog;

namespace Booking.Application.Module.Scheduling.Commands;

/// <summary>✗ Decisão 1 — o Scheduling lê a entidade interna do Catalog direto.</summary>
public sealed class ConfirmAppointmentReadingCatalogInternals(Category category)
{
    public Category Category { get; } = category;
}

/// <summary>✓ Decisão 1 — o Scheduling consulta o Catalog pelo contrato público.</summary>
public sealed class RequestAppointmentThroughCatalogContract(IServiceCatalog catalog)
{
    public IServiceCatalog Catalog { get; } = catalog;
}
