using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.People;
using Booking.Application.Module.Catalog.Converter;
using Booking.Arguments.Module.Catalog;
using Booking.Domain.Entity.Module.Catalog;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Catalog;

namespace Booking.Application.Module.Catalog.Commands;

public sealed class CreateServiceCommand(IServiceRepository services, IActorContext actor, IUnitOfWork unitOfWork)
{
    public async Task<ServiceResponse> ExecuteAsync(SaveServiceRequest r, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireOwner();

        Service service = Service.Create(
            businessId, r.Name, r.Description, r.DurationMinutes, r.BufferBeforeMinutes, r.BufferAfterMinutes, r.SlotStepMinutes, r.PriceCents, r.SuppliesNote);

        if (!r.IsActive)
        {
            service.Deactivate();
        }

        services.Add(service);
        await unitOfWork.SaveChangesAsync(ct);

        return CatalogConverter.ToResponse(service, []);
    }
}

public sealed class UpdateServiceCommand(
    IServiceRepository services,
    IServiceProfessionalRepository links,
    IActorContext actor,
    IUnitOfWork unitOfWork)
{
    public async Task<ServiceResponse> ExecuteAsync(Guid serviceId, SaveServiceRequest r, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireOwner();

        Service service = await services.GetByIdAsync(serviceId, ct) ?? throw new DomainException("service.not_found");

        service.Update(r.Name, r.Description, r.DurationMinutes, r.BufferBeforeMinutes, r.BufferAfterMinutes, r.SlotStepMinutes, r.PriceCents, r.SuppliesNote);

        if (r.IsActive)
        {
            service.Activate();
        }
        else
        {
            service.Deactivate();
        }

        await unitOfWork.SaveChangesAsync(ct);

        IReadOnlyList<ServiceProfessional> assigned = await links.ListForServicesAsync(businessId, [service.Id], ct);
        return CatalogConverter.ToResponse(service, assigned);
    }
}

/// <summary>Habilita (ou atualiza os overrides de) um profissional ativo do mesmo estabelecimento.</summary>
public sealed class EnableProfessionalCommand(
    IServiceRepository services,
    IServiceProfessionalRepository links,
    IPeopleDirectory people,
    IActorContext actor,
    IUnitOfWork unitOfWork)
{
    public async Task<ServiceResponse> ExecuteAsync(Guid serviceId, Guid professionalId, EnableProfessionalRequest r, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireOwner();

        Service service = await services.GetByIdAsync(serviceId, ct) ?? throw new DomainException("service.not_found");

        ProfessionalInfo? professional = await people.GetProfessionalAsync(businessId, professionalId, ct);

        if (professional is not { IsActive: true })
        {
            throw new DomainException("professional.not_found");
        }

        ServiceProfessional? link = await links.GetAsync(serviceId, professionalId, ct);

        if (link is null)
        {
            links.Add(ServiceProfessional.Enable(businessId, serviceId, professionalId, r.PriceOverrideCents, r.DurationOverrideMinutes));
        }
        else
        {
            link.SetOverrides(r.PriceOverrideCents, r.DurationOverrideMinutes);
        }

        await unitOfWork.SaveChangesAsync(ct);

        IReadOnlyList<ServiceProfessional> assigned = await links.ListForServicesAsync(businessId, [service.Id], ct);
        return CatalogConverter.ToResponse(service, assigned);
    }
}

public sealed class DisableProfessionalCommand(IServiceProfessionalRepository links, IActorContext actor, IUnitOfWork unitOfWork)
{
    public async Task ExecuteAsync(Guid serviceId, Guid professionalId, CancellationToken ct = default)
    {
        actor.RequireOwner();

        ServiceProfessional link = await links.GetAsync(serviceId, professionalId, ct)
            ?? throw new DomainException("service_professional.not_found");

        links.Remove(link);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
