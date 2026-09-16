using Booking.Domain.Base;

namespace Booking.Domain.Module.Catalog;

/// <summary>Entidade interna do módulo Catalog — alvo da violação de fronteira plantada.</summary>
public sealed class Category : BaseEntity;

/// <summary>✓ Decisão 2 — Category é cadastro sem regra de estado; pode usar o Base.</summary>
public interface ICategoryRepository : IBaseRepository<Category>
{
}
