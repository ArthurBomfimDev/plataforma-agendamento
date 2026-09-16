using Booking.Domain.Module.Scheduling;
using Booking.Infrastructure.Persistence.Entity;
using Microsoft.EntityFrameworkCore;

namespace Booking.Infrastructure.Persistence.Context;

public sealed class LegacyDbContext(DbContextOptions<LegacyDbContext> options) : DbContext(options)
{
    /// <summary>✗ Decisão 5.</summary>
    public DbSet<AppointmentRecord> AppointmentRecords => Set<AppointmentRecord>();

    /// <summary>✓ Decisão 5.</summary>
    public DbSet<Appointment> Appointments => Set<Appointment>();
}
