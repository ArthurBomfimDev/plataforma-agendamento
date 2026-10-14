using Booking.Domain.Entity.Base;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.Catalog;

/// <summary>
/// O que o estabelecimento oferece. Ocupação total na agenda = buffer antes + duração + buffer depois —
/// é esse intervalo que a constraint de exclusão compara, não só a duração.
/// </summary>
public sealed class Service : BaseEntity, IAuditable, ITenantScoped
{
    public const int MaxDurationMinutes = 480;
    public const int MaxBufferMinutes = 120;
    public const int MinSlotStepMinutes = 5;

    public Guid BusinessId { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public int DurationMinutes { get; private set; }
    public int BufferBeforeMinutes { get; private set; }
    public int BufferAfterMinutes { get; private set; }
    public int SlotStepMinutes { get; private set; }

    /// <summary>Centavos, inteiro. Nunca ponto flutuante.</summary>
    public long PriceCents { get; private set; }

    /// <summary>Nota de insumos em texto livre — substitui o módulo de estoque, fora do MVP.</summary>
    public string? SuppliesNote { get; private set; }

    public bool IsActive { get; private set; }

    private Service()
    {
    }

    public static Service Create(
        Guid businessId,
        string name,
        string? description,
        int durationMinutes,
        int bufferBeforeMinutes,
        int bufferAfterMinutes,
        int slotStepMinutes,
        long priceCents,
        string? suppliesNote)
    {
        var service = new Service { BusinessId = businessId, IsActive = true };
        service.Update(name, description, durationMinutes, bufferBeforeMinutes, bufferAfterMinutes, slotStepMinutes, priceCents, suppliesNote);
        return service;
    }

    // Mudar preço ou duração não afeta agendamento já marcado: o Appointment guarda a própria cópia.
    public void Update(
        string name,
        string? description,
        int durationMinutes,
        int bufferBeforeMinutes,
        int bufferAfterMinutes,
        int slotStepMinutes,
        long priceCents,
        string? suppliesNote)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("service.name_required");
        }

        EnsureDuration(durationMinutes);

        if (bufferBeforeMinutes is < 0 or > MaxBufferMinutes || bufferAfterMinutes is < 0 or > MaxBufferMinutes)
        {
            throw new DomainException("service.buffer_invalid");
        }

        if (slotStepMinutes < MinSlotStepMinutes || slotStepMinutes > durationMinutes)
        {
            throw new DomainException("service.slot_step_invalid");
        }

        EnsurePrice(priceCents);

        Name = name.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        DurationMinutes = durationMinutes;
        BufferBeforeMinutes = bufferBeforeMinutes;
        BufferAfterMinutes = bufferAfterMinutes;
        SlotStepMinutes = slotStepMinutes;
        PriceCents = priceCents;
        SuppliesNote = string.IsNullOrWhiteSpace(suppliesNote) ? null : suppliesNote.Trim();
    }

    public void Activate() => IsActive = true;

    public void Deactivate() => IsActive = false;

    public static void EnsureDuration(int durationMinutes)
    {
        if (durationMinutes is <= 0 or > MaxDurationMinutes)
        {
            throw new DomainException("service.duration_invalid");
        }
    }

    public static void EnsurePrice(long priceCents)
    {
        if (priceCents < 0)
        {
            throw new DomainException("service.price_invalid");
        }
    }
}
