using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Availability;
using Booking.Application.Contracts.Catalog;
using Booking.Application.Contracts.People;
using Booking.Application.Module.Tenancy.Converter;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Tenancy.Commands;

/// <summary>Carrega o estabelecimento do contexto ativo, exigindo papel de proprietário.</summary>
public sealed class CurrentBusinessLoader(IBusinessRepository businesses, IActorContext actor)
{
    public async Task<Business> LoadForOwnerAsync(CancellationToken ct)
    {
        Guid businessId = actor.RequireOwner();

        return await businesses.GetByIdAsync(businessId, ct)
            ?? throw new DomainException("business.not_found");
    }
}

public sealed class UpdateSchedulingPolicyCommand(CurrentBusinessLoader loader, IUnitOfWork unitOfWork)
{
    public async Task<BusinessDetailResponse> ExecuteAsync(UpdateSchedulingPolicyRequest request, CancellationToken ct = default)
    {
        Business business = await loader.LoadForOwnerAsync(ct);

        business.UpdateSchedulingPolicy(
            request.AutoConfirm,
            request.PendingExpirationHours,
            request.MinLeadTimeHours,
            request.BookingHorizonDays,
            request.CancellationWindowHours);

        if (!string.IsNullOrWhiteSpace(request.TimeZone))
        {
            business.ChangeTimeZone(request.TimeZone);
        }

        await unitOfWork.SaveChangesAsync(ct);
        return BusinessConverter.ToDetail(business);
    }
}

public sealed class UpdateAddressCommand(CurrentBusinessLoader loader, IUnitOfWork unitOfWork)
{
    public async Task<BusinessDetailResponse> ExecuteAsync(UpdateAddressRequest request, CancellationToken ct = default)
    {
        Business business = await loader.LoadForOwnerAsync(ct);

        business.UpdateAddress(request.Street, request.StreetNumber, request.District, request.City, request.State, request.PostalCode);

        await unitOfWork.SaveChangesAsync(ct);
        return BusinessConverter.ToDetail(business);
    }
}

/// <summary>
/// Registra o ponto escolhido pelo proprietário. Sem geocodificador integrado ainda (porta IGeocodingProvider
/// fora do recorte), o palpite e a confirmação chegam juntos, vindos do mapa da tela.
/// </summary>
public sealed class ConfirmLocationCommand(CurrentBusinessLoader loader, IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task<BusinessDetailResponse> ExecuteAsync(ConfirmLocationRequest request, CancellationToken ct = default)
    {
        Business business = await loader.LoadForOwnerAsync(ct);

        if (!System.Enum.TryParse(request.Precision, ignoreCase: true, out LocationPrecision precision))
        {
            throw new DomainException("business.location_precision_invalid");
        }

        GeoPoint point = GeoPoint.Of(request.Latitude, request.Longitude);
        DateTimeOffset now = clock.GetUtcNow();
        string source = string.IsNullOrWhiteSpace(request.Source) ? "owner-pin" : request.Source.Trim();

        business.Geocode(point, precision, source, now);
        business.ConfirmLocation(point, precision, now);

        await unitOfWork.SaveChangesAsync(ct);
        return BusinessConverter.ToDetail(business);
    }
}

/// <summary>Envia para análise depois de conferir a checklist de ativação nos outros módulos.</summary>
public sealed class SubmitBusinessCommand(CurrentBusinessLoader loader, ActivationChecklist checklist, IUnitOfWork unitOfWork)
{
    public async Task<BusinessDetailResponse> ExecuteAsync(CancellationToken ct = default)
    {
        Business business = await loader.LoadForOwnerAsync(ct);

        IReadOnlyList<string> missing = await checklist.MissingForSubmitAsync(business, ct);

        if (missing.Count > 0)
        {
            throw new DomainException("business.activation_checklist_incomplete", new Dictionary<string, object?> { ["missing"] = missing });
        }

        business.Submit();

        await unitOfWork.SaveChangesAsync(ct);
        return BusinessConverter.ToDetail(business);
    }
}
