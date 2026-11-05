using Booking.Application.Common.Media;
using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Module.Catalog.Converter;
using Booking.Arguments.Module.Catalog;
using Booking.Domain.Entity.Module.Catalog;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Catalog;

namespace Booking.Application.Module.Catalog.Commands;

/// <summary>
/// Foto do serviço (ADR-023, mesmas validações do logotipo e da capa: assinatura do arquivo, 5 MB, JPEG/PNG/WebP, EXIF
/// removido, variantes WebP, nome GUID). Só o dono. Trocar apaga os arquivos antigos depois de gravar a troca. Serviço
/// de outro estabelecimento não é encontrado (filtro de tenant): 404.
/// </summary>
public sealed class ServiceImageCommand(
    IServiceRepository services,
    IServiceProfessionalRepository links,
    IActorContext actor,
    ImageStore store,
    IUnitOfWork unitOfWork)
{
    public async Task<ServiceResponse> SetAsync(Guid serviceId, Stream upload, CancellationToken ct = default)
    {
        (Service service, Guid businessId) = await LoadAsync(serviceId, ct);

        string key = await store.StoreAsync(upload, $"businesses/{businessId:N}/services", ct);
        string? previous = service.ReplaceImage(key);

        try
        {
            await unitOfWork.SaveChangesAsync(ct);
        }
        catch
        {
            // A troca não foi gravada: os arquivos novos não servem para nada.
            await store.DeleteAsync(key, CancellationToken.None);
            throw;
        }

        await store.DeleteAsync(previous, ct);
        return await RespondAsync(service, businessId, ct);
    }

    public async Task<ServiceResponse> RemoveAsync(Guid serviceId, CancellationToken ct = default)
    {
        (Service service, Guid businessId) = await LoadAsync(serviceId, ct);

        string? previous = service.ReplaceImage(null);
        await unitOfWork.SaveChangesAsync(ct);

        await store.DeleteAsync(previous, ct);
        return await RespondAsync(service, businessId, ct);
    }

    private async Task<(Service Service, Guid BusinessId)> LoadAsync(Guid serviceId, CancellationToken ct)
    {
        Guid businessId = actor.RequireOwner();

        Service service = await services.GetByIdAsync(serviceId, ct) ?? throw new DomainException("service.not_found");
        return (service, businessId);
    }

    private async Task<ServiceResponse> RespondAsync(Service service, Guid businessId, CancellationToken ct)
    {
        IReadOnlyList<ServiceProfessional> assigned = await links.ListForServicesAsync(businessId, [service.Id], ct);
        return CatalogConverter.ToResponse(service, assigned, store);
    }
}
