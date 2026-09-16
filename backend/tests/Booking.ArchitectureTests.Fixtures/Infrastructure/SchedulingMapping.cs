using Booking.Domain.Module.Scheduling;
using Booking.Infrastructure.Persistence.Entity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Module.Scheduling.Mapping;

/// <summary>✗ Decisão 5 — o EF mapeia a entidade de persistência, não a de domínio.</summary>
public sealed class AppointmentRecordMapping : IEntityTypeConfiguration<AppointmentRecord>
{
    public void Configure(EntityTypeBuilder<AppointmentRecord> builder)
    {
        builder.HasKey(record => record.Id);
    }
}

/// <summary>✓ Decisão 5 — o EF mapeia a entidade de domínio direto.</summary>
public sealed class AppointmentMapping : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.HasKey(appointment => appointment.Id);
    }
}
