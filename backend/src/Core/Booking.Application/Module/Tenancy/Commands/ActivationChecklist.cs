using Booking.Application.Contracts.Availability;
using Booking.Application.Contracts.Catalog;
using Booking.Application.Contracts.People;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Module.Tenancy;

namespace Booking.Application.Module.Tenancy.Commands;

/// <summary>
/// Checklist de ativação, consultada nos outros módulos pelos contratos. A submissão exige os itens marcados como
/// obrigatórios; o detalhe do Admin mostra todos, inclusive os que o código ainda não exige.
/// </summary>
public sealed class ActivationChecklist(IServiceCatalog catalog, IPeopleDirectory people, IAvailabilityService availability)
{
    public async Task<IReadOnlyList<ChecklistItemResponse>> EvaluateAsync(Business business, CancellationToken ct)
    {
        return
        [
            // CNPJ ou CPF com dígito verificador conferido na criação (Document.Of): nunca chega inválido aqui.
            new ChecklistItemResponse("document", true, RequiredForSubmit: true),

            // A submissão não confere o endereço; só o ponto confirmado. Fica visível para o Admin decidir.
            new ChecklistItemResponse("address", business.Street is not null && business.City is not null && business.State is not null, RequiredForSubmit: false),
            new ChecklistItemResponse("location_confirmed", business.LocationConfirmedAt is not null, RequiredForSubmit: true),
            new ChecklistItemResponse("professional", await people.CountActiveProfessionalsAsync(business.Id, ct) > 0, RequiredForSubmit: true),
            new ChecklistItemResponse("service_with_professional", await catalog.HasBookableServiceAsync(business.Id, ct), RequiredForSubmit: true),
            new ChecklistItemResponse("work_schedule", await availability.HasWorkScheduleAsync(business.Id, ct), RequiredForSubmit: true),

            // Foto do estabelecimento não existe no recorte de entrega.
            new ChecklistItemResponse("photo", false, RequiredForSubmit: false),
        ];
    }

    public async Task<IReadOnlyList<string>> MissingForSubmitAsync(Business business, CancellationToken ct) =>
        [.. (await EvaluateAsync(business, ct)).Where(i => i.RequiredForSubmit && !i.Done).Select(i => i.Key)];
}
