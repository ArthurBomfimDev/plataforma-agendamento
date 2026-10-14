namespace Booking.Application.Contracts.Catalog;

/// <summary>Serviço como ele é agendado com um profissional: já com os overrides de preço e duração aplicados.</summary>
public sealed record BookableService(
    Guid ServiceId,
    Guid BusinessId,
    Guid ProfessionalId,
    string Name,
    int DurationMinutes,
    int BufferBeforeMinutes,
    int BufferAfterMinutes,
    int SlotStepMinutes,
    long PriceCents);

/// <summary>Superfície pública do módulo Catalog.</summary>
public interface IServiceCatalog
{
    /// <summary>Nulo se o serviço não existe, está inativo ou o profissional não está habilitado nele.</summary>
    Task<BookableService?> GetBookableAsync(Guid businessId, Guid serviceId, Guid professionalId, CancellationToken ct = default);

    Task<bool> HasBookableServiceAsync(Guid businessId, CancellationToken ct = default);

    /// <summary>Dos estabelecimentos informados, os que têm serviço ativo cujo nome contém o termo.</summary>
    Task<IReadOnlySet<Guid>> FilterBusinessesOfferingAsync(IReadOnlyCollection<Guid> businessIds, string term, CancellationToken ct = default);
}
