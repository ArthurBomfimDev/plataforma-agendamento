using Booking.Domain.Entity.Base;

namespace Booking.Domain.Entity.Module.Catalog.Planted;

/// <summary>Entidade interna do módulo Catalog — alvo da violação de fronteira plantada.</summary>
public sealed class Service : BaseEntity;

/// <summary>✓ Decisão 2 — Service é cadastro sem regra de estado; pode usar o Base.</summary>
public interface IServiceRepository : IBaseRepository<Service>
{
}
