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

/// <summary>O serviço que representa um estabelecimento num resultado de busca.</summary>
public sealed record ServiceHighlight(Guid BusinessId, Guid ServiceId, string Name, int DurationMinutes, long FromPriceCents);

/// <summary>Superfície pública do módulo Catalog.</summary>
public interface IServiceCatalog
{
    /// <summary>Nulo se o serviço não existe, está inativo ou o profissional não está habilitado nele.</summary>
    Task<BookableService?> GetBookableAsync(Guid businessId, Guid serviceId, Guid professionalId, CancellationToken ct = default);

    Task<bool> HasBookableServiceAsync(Guid businessId, CancellationToken ct = default);

    /// <summary>
    /// Para cada estabelecimento, o serviço que a busca mostra no card: o mais barato entre os ativos com profissional
    /// habilitado cujo nome contém o termo; sem termo, ou sem serviço que case com ele, o mais barato do
    /// estabelecimento. Preço "a partir de": o menor preço efetivo entre os profissionais (com override).
    /// </summary>
    Task<IReadOnlyDictionary<Guid, ServiceHighlight>> GetHighlightsAsync(
        IReadOnlyCollection<Guid> businessIds, string? term, CancellationToken ct = default);

    /// <summary>Dos estabelecimentos informados, os que têm serviço ativo cujo nome contém o termo.</summary>
    Task<IReadOnlySet<Guid>> FilterBusinessesOfferingAsync(IReadOnlyCollection<Guid> businessIds, string term, CancellationToken ct = default);
}
