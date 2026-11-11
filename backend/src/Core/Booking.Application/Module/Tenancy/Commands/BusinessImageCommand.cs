using Booking.Application.Common.Media;
using Booking.Application.Common.Persistence;
using Booking.Application.Module.Tenancy.Converter;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Module.Tenancy;

namespace Booking.Application.Module.Tenancy.Commands;

public enum BusinessImageSlot
{
    Logo,
    Cover,
}

/// <summary>
/// Logotipo e capa do estabelecimento do contexto ativo (ADR-023). Só o dono. Trocar apaga os arquivos antigos —
/// depois de gravar a troca, para nunca ficar sem imagem se a gravação falhar.
/// </summary>
public sealed class BusinessImageCommand(CurrentBusinessLoader loader, ImageStore store, IUnitOfWork unitOfWork)
{
    public async Task<BusinessDetailResponse> SetAsync(BusinessImageSlot slot, Stream upload, CancellationToken ct = default)
    {
        Business business = await loader.LoadForOwnerAsync(ct);

        string key = await store.StoreAsync(upload, $"businesses/{business.Id:N}", ct);
        string? previous = Replace(business, slot, key);

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
        return BusinessConverter.ToDetail(business, store);
    }

    public async Task<BusinessDetailResponse> RemoveAsync(BusinessImageSlot slot, CancellationToken ct = default)
    {
        Business business = await loader.LoadForOwnerAsync(ct);

        string? previous = Replace(business, slot, null);
        await unitOfWork.SaveChangesAsync(ct);

        await store.DeleteAsync(previous, ct);
        return BusinessConverter.ToDetail(business, store);
    }

    private static string? Replace(Business business, BusinessImageSlot slot, string? key) => slot == BusinessImageSlot.Logo
        ? business.ReplaceLogo(key)
        : business.ReplaceCover(key);
}
