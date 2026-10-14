using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Interface.Repository.Module.People;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Module.People.Repository;

public sealed class ProfessionalRepository(BookingDbContext context) : IProfessionalRepository
{
    public Task<Professional?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        context.Set<Professional>().FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<PagedResult<Professional>> ListAsync(PageRequest page, CancellationToken ct = default) =>
        context.Set<Professional>().OrderBy(x => x.DisplayName).ToPagedAsync(page, ct);

    public Task<PagedResult<Professional>> ListActiveOfBusinessAsync(Guid businessId, PageRequest page, CancellationToken ct = default) =>
        context.OfBusiness<Professional>(businessId).AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.DisplayName).ToPagedAsync(page, ct);

    public void Add(Professional professional) => context.Set<Professional>().Add(professional);
}

public sealed class CustomerRepository(BookingDbContext context) : ICustomerRepository
{
    public Task<Customer?> GetByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        context.Set<Customer>().FirstOrDefaultAsync(x => x.UserId == userId, ct);

    public void Add(Customer customer) => context.Set<Customer>().Add(customer);
}
