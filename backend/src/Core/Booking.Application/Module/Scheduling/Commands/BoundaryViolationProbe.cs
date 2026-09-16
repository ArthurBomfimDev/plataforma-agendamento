using Booking.Domain.Module.Catalog;

namespace Booking.Application.Module.Scheduling.Commands;

// VIOLAÇÃO PROPOSITAL — o Scheduling usa a entidade interna do Catalog em vez do contrato público.
// Prova de que Booking.ArchitectureTests quebra o build. Removida no commit seguinte.
public sealed class BoundaryViolationProbe(BoundaryProbeItem item)
{
    public BoundaryProbeItem Item { get; } = item;
}
