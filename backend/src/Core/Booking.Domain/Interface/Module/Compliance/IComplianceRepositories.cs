using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Compliance;
using Booking.Domain.Enum.Module.Compliance;

namespace Booking.Domain.Interface.Repository.Module.Compliance;

public interface IConsentRecordRepository
{
    Task<IReadOnlyList<ConsentRecord>> ListActiveAsync(Guid userId, ConsentPurpose purpose, CancellationToken ct = default);

    Task<PagedResult<ConsentRecord>> ListForUserAsync(Guid userId, PageRequest page, CancellationToken ct = default);

    void Add(ConsentRecord record);
}

public interface ISensitiveAccessLogRepository
{
    void Add(SensitiveAccessLog entry);
}
