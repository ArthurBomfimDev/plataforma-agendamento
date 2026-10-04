using Booking.Domain.Entity.Base;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Booking.Infrastructure.Persistence.Mapping.Base;

public abstract class BaseMapping<T> : IEntityTypeConfiguration<T> where T : BaseEntity
{
    public void Configure(EntityTypeBuilder<T> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd();

        if (typeof(AggregateRoot).IsAssignableFrom(typeof(T)))
        {
            builder.Ignore(nameof(AggregateRoot.DomainEvents));
        }

        if (typeof(IAuditable).IsAssignableFrom(typeof(T)))
        {
            builder.Property<DateTimeOffset>(AuditColumns.CreatedAt).IsRequired();
            builder.Property<DateTimeOffset?>(AuditColumns.UpdateAt);
        }

        if (typeof(ITenantScoped).IsAssignableFrom(typeof(T)))
        {
            builder.Property(nameof(ITenantScoped.BusinessId)).IsRequired();
            builder.HasIndex(nameof(ITenantScoped.BusinessId));
        }

        ConfigureEntity(builder);
    }

    protected abstract void ConfigureEntity(EntityTypeBuilder<T> builder);
}
