using Booking.Application.Common.Media;
using Booking.Application.Contracts.Catalog;
using Booking.Application.Contracts.Tenancy;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.People;

namespace Booking.Application.Module.People.Queries;

/// <summary>
/// Página pública do profissional (ADR-031). Anônima. Só aparece profissional <b>ativo</b> de estabelecimento
/// <b>ativo</b>; qualquer outro caso responde 404, como se não existisse (não confirma que o perfil existiu).
/// </summary>
public sealed class GetPublicProfessionalQuery(
    IProfessionalRepository professionals, IBusinessDirectory businesses, IServiceCatalog catalog, IImageUrls images)
{
    public async Task<ProfessionalPageResponse> ExecuteAsync(Guid professionalId, CancellationToken ct = default)
    {
        Professional professional = await professionals.GetByIdAcrossTenantsAsync(professionalId, ct)
            ?? throw new DomainException("professional.not_found");

        BusinessSchedulingInfo? scheduling = await businesses.GetSchedulingInfoAsync(professional.BusinessId, ct);

        if (!professional.IsActive || scheduling is not { IsBookable: true })
        {
            throw new DomainException("professional.not_found");
        }

        BusinessContactInfo contact = await businesses.GetContactInfoAsync(professional.BusinessId, ct)
            ?? throw new DomainException("professional.not_found");

        IReadOnlyList<ProfessionalServiceInfo> services = await catalog.ListForProfessionalAsync(professional.BusinessId, professional.Id, ct);

        return new ProfessionalPageResponse(
            professional.Id,
            professional.DisplayName,
            professional.Specialty,
            professional.Bio,
            professional.Registration,
            images.For(professional.PhotoImageKey),
            new ProfessionalBusinessResponse(contact.BusinessId, contact.Name, contact.AddressLine, contact.RequiresSensitiveHandling ? "Saude" : "Beleza"),
            [.. services.Select(s => new ProfessionalServiceResponse(s.ServiceId, s.Name, s.DurationMinutes, s.PriceCents, images.For(s.ImageKey)))]);
    }
}
