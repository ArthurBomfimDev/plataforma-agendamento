namespace Booking.Arguments.Module.Catalog;

public sealed record SaveServiceRequest(
    string Name,
    string? Description,
    int DurationMinutes,
    int BufferBeforeMinutes,
    int BufferAfterMinutes,
    int SlotStepMinutes,
    long PriceCents,
    string? SuppliesNote,
    bool IsActive = true);

public sealed record EnableProfessionalRequest(long? PriceOverrideCents, int? DurationOverrideMinutes);

/// <summary>Profissional habilitado no serviço, com preço e duração já efetivos.</summary>
public sealed record ServiceProfessionalResponse(Guid ProfessionalId, long PriceCents, int DurationMinutes, bool HasOverride);

public sealed record ServiceResponse(
    Guid Id,
    string Name,
    string? Description,
    int DurationMinutes,
    int BufferBeforeMinutes,
    int BufferAfterMinutes,
    int SlotStepMinutes,
    long PriceCents,
    string? SuppliesNote,
    bool IsActive,
    IReadOnlyList<ServiceProfessionalResponse> Professionals);

/// <summary>Vitrine: sem nota de insumos e sem buffers internos.</summary>
public sealed record PublicServiceResponse(
    Guid Id,
    string Name,
    string? Description,
    int DurationMinutes,
    long PriceCents,
    IReadOnlyList<ServiceProfessionalResponse> Professionals);
