using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.ValueObject;

namespace Booking.Domain.Interface.Repository.Module.Tenancy;

public interface IBusinessRepository
{
    Task<Business?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<bool> ExistsByDocumentAsync(Document document, CancellationToken ct = default);

    /// <summary>
    /// Estabelecimentos ativos, com ponto confirmado, dentro do raio — mais próximos primeiro. Primeira etapa
    /// da busca (ST_DWithin sobre índice GiST); texto, paginação e horários vêm depois, sobre este conjunto.
    /// </summary>
    Task<IReadOnlyList<Business>> FindBookableNearbyAsync(GeoPoint center, double radiusMeters, int limit, CancellationToken ct = default);

    /// <summary>Fila do Admin: todos os estabelecimentos no estado pedido, mais antigos primeiro.</summary>
    Task<PagedResult<Business>> ListByStatusAsync(BusinessStatus status, PageRequest page, CancellationToken ct = default);

    void Add(Business business);
}
