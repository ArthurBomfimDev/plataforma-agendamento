using Booking.Application.Common.Media;
using Booking.Application.Common.Persistence;
using Booking.Application.Module.Tenancy.Converter;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Module.Tenancy;

namespace Booking.Application.Module.Tenancy.Commands;

/// <summary>
/// Vitrine do estabelecimento do contexto ativo: até 3 fotos, a primeira é a capa. Só o dono. Como no logotipo e na capa
/// (ADR-023), o arquivo antigo só é apagado depois de gravar a troca. A galeria nunca tem buraco: remover promove a
/// foto seguinte, e enviar depois do fim ocupa o primeiro lugar livre.
/// </summary>
public sealed class BusinessGalleryCommand(CurrentBusinessLoader loader, ImageStore store, IUnitOfWork unitOfWork)
{
    public async Task<BusinessDetailResponse> SetAsync(int slot, Stream upload, CancellationToken ct = default)
    {
        Business business = await loader.LoadForOwnerAsync(ct);

        // O lugar é conferido antes de gravar qualquer arquivo: slot inválido não deixa imagem órfã no armazenamento.
        Business.EnsureGallerySlot(slot);

        string key = await store.StoreAsync(upload, $"businesses/{business.Id:N}", ct);
        string? previous = business.SetGalleryPhoto(slot, key);

        try
        {
            await unitOfWork.SaveChangesAsync(ct);
        }
        catch
        {
            await store.DeleteAsync(key, CancellationToken.None);
            throw;
        }

        await store.DeleteAsync(previous, ct);
        return BusinessConverter.ToDetail(business, store);
    }

    public async Task<BusinessDetailResponse> RemoveAsync(int slot, CancellationToken ct = default)
    {
        Business business = await loader.LoadForOwnerAsync(ct);

        string? removed = business.RemoveGalleryPhoto(slot);
        await unitOfWork.SaveChangesAsync(ct);

        await store.DeleteAsync(removed, ct);
        return BusinessConverter.ToDetail(business, store);
    }

    public async Task<BusinessDetailResponse> ReorderAsync(ReorderPhotosRequest request, CancellationToken ct = default)
    {
        Business business = await loader.LoadForOwnerAsync(ct);

        business.ReorderGallery(request.Order);
        await unitOfWork.SaveChangesAsync(ct);

        return BusinessConverter.ToDetail(business, store);
    }
}
