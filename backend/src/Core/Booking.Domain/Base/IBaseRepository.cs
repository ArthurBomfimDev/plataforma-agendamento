namespace Booking.Domain.Base;

/// <summary>
/// Repositório genérico de cadastro.
/// </summary>
/// <remarks>
/// <para>
/// ⚠️ Restrito a cadastros sem regra de estado: <c>Category</c>, <c>Service</c> e
/// <c>WorkSchedule</c> (ADR-010, decisão 2). Verificado por BaseUsageTests.
/// </para>
/// <para>
/// <c>Appointment</c>, <c>Review</c>, <c>AppointmentEvent</c>, <c>ConsentRecord</c> e
/// <c>SensitiveAccessLog</c> nunca usam esta base: <c>Update</c> genérico pularia a máquina de
/// estados do agendamento, e <c>Remove</c> apagaria o histórico que o snapshot existe para preservar.
/// Esses agregados usam <c>Commands/</c> e <c>Queries/</c> com operações nomeadas.
/// </para>
/// </remarks>
public interface IBaseRepository<TEntity>
    where TEntity : BaseEntity
{
    Task<TEntity?> GetById(Guid id, CancellationToken cancellationToken);

    Task<PagedResult<TEntity>> List(PageRequest page, CancellationToken cancellationToken);

    Task Add(TEntity entity, CancellationToken cancellationToken);

    void Update(TEntity entity);

    void Remove(TEntity entity);
}
