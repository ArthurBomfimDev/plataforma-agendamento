using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Notifications;
using Booking.Application.Contracts.Tenancy;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Enum.Module.People;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.People;

namespace Booking.Application.Module.People.Commands;

/// <summary>
/// "Solicitar remoção deste perfil" na página pública. Não exige conta (a rota tem limite de taxa por IP). Só se pede a
/// remoção do que o público vê: profissional ativo de estabelecimento ativo. Avisa os donos pela outbox e cai na fila do
/// Admin; nada é desativado automaticamente.
/// </summary>
public sealed class RequestProfessionalRemovalCommand(
    IProfessionalRepository professionals,
    IProfessionalRemovalRequestRepository requests,
    IBusinessDirectory businesses,
    IProfessionalRemovalNotifier notifier,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task ExecuteAsync(Guid professionalId, RequestProfessionalRemovalRequest request, CancellationToken ct = default)
    {
        Professional professional = await professionals.GetByIdAcrossTenantsAsync(professionalId, ct)
            ?? throw new DomainException("professional.not_found");

        BusinessSchedulingInfo? scheduling = await businesses.GetSchedulingInfoAsync(professional.BusinessId, ct);

        if (!professional.IsActive || scheduling is not { IsBookable: true })
        {
            throw new DomainException("professional.not_found");
        }

        requests.Add(ProfessionalRemovalRequest.Create(
            professional.BusinessId, professional.Id, request.Reason, request.Contact, clock.GetUtcNow()));

        await notifier.NotifyAsync(
            new ProfessionalRemovalFacts(
                professional.BusinessId, professional.DisplayName, request.Reason.Trim(), request.Contact?.Trim(), scheduling.RequiresSensitiveHandling),
            ct);

        await unitOfWork.SaveChangesAsync(ct);
    }
}

/// <summary>Fila de pedidos de remoção do Admin, os abertos por padrão.</summary>
public sealed class ListProfessionalRemovalRequestsQuery(
    IProfessionalRemovalRequestRepository requests,
    IProfessionalRepository professionals,
    IBusinessDirectory businesses,
    IActorContext actor)
{
    public async Task<PagedResult<ProfessionalRemovalResponse>> ExecuteAsync(string? status, PageRequest page, CancellationToken ct = default)
    {
        actor.RequirePlatformAdmin();

        RemovalRequestStatus filter = RemovalRequestStatus.Open;
        if (!string.IsNullOrWhiteSpace(status) && !System.Enum.TryParse(status, ignoreCase: true, out filter))
        {
            throw new DomainException("removal_request.status_invalid");
        }

        PagedResult<ProfessionalRemovalRequest> result = await requests.ListByStatusAsync(filter, page, ct);
        var items = new List<ProfessionalRemovalResponse>(result.Items.Count);

        foreach (ProfessionalRemovalRequest request in result.Items)
        {
            items.Add(await ToResponseAsync(request, professionals, businesses, ct));
        }

        return new PagedResult<ProfessionalRemovalResponse>(items, result.Page, result.PageSize, result.TotalCount);
    }

    internal static async Task<ProfessionalRemovalResponse> ToResponseAsync(
        ProfessionalRemovalRequest request, IProfessionalRepository professionals, IBusinessDirectory businesses, CancellationToken ct)
    {
        string professionalName = (await professionals.GetByIdAcrossTenantsAsync(request.ProfessionalId, ct))?.DisplayName ?? string.Empty;
        string businessName = (await businesses.GetContactInfoAsync(request.BusinessId, ct))?.Name ?? string.Empty;

        return new ProfessionalRemovalResponse(
            request.Id,
            request.ProfessionalId,
            professionalName,
            request.BusinessId,
            businessName,
            request.Reason,
            request.Contact,
            request.Status.ToString(),
            request.RequestedAt,
            request.ResolvedByUserId,
            request.ResolvedAt,
            request.Resolution);
    }
}

/// <summary>O Admin encerra o pedido; fica registrado quem decidiu e quando. Desativar o perfil é decisão do dono.</summary>
public sealed class ResolveProfessionalRemovalRequestCommand(
    IProfessionalRemovalRequestRepository requests,
    IProfessionalRepository professionals,
    IBusinessDirectory businesses,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<ProfessionalRemovalResponse> ExecuteAsync(Guid requestId, string? note, CancellationToken ct = default)
    {
        Guid adminId = actor.RequirePlatformAdmin();

        ProfessionalRemovalRequest request = await requests.GetByIdAsync(requestId, ct)
            ?? throw new DomainException("removal_request.not_found");

        request.Resolve(adminId, note, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(ct);

        return await ListProfessionalRemovalRequestsQuery.ToResponseAsync(request, professionals, businesses, ct);
    }
}
