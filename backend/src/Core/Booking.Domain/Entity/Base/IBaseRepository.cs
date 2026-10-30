namespace Booking.Domain.Entity.Base;

public interface IBaseRepository<TEntity>
    where TEntity : BaseEntity
{
    Task<TEntity?> GetById(Guid id, CancellationToken cancellationToken);

    Task<PagedResult<TEntity>> List(PageRequest page, CancellationToken cancellationToken);

    Task Add(TEntity entity, CancellationToken cancellationToken);

    void Update(TEntity entity);

    void Remove(TEntity entity);
}
