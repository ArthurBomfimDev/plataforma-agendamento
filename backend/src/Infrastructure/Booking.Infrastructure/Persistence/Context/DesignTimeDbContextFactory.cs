using Booking.Application.Common.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Booking.Infrastructure.Persistence.Context;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<BookingDbContext>
{
    public BookingDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<BookingDbContext>()
                .UseNpgsql("Host=localhost;Database=booking", o => o.UseNetTopologySuite())
                .Options,
            new NoTenantContext());

    private sealed class NoTenantContext : ITenantContext
    {
        public Guid? BusinessId => null;
    }
}
