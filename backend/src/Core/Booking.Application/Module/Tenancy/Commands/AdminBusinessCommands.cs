using Booking.Application.Common.Media;
using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Module.Tenancy.Converter;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Tenancy;

namespace Booking.Application.Module.Tenancy.Commands;

/// <summary>
/// Decisões do Admin da plataforma sobre um estabelecimento (ADR-020). Cada uma chama o método de domínio que já
/// guarda a máquina de estados; o comando só confere o papel e registra quem decidiu.
/// </summary>
public sealed class AdminBusinessCommands(
    IBusinessRepository businesses,
    ActivationChecklist checklist,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock,
    IImageUrls images)
{
    /// <summary>Em análise → ativo, com o selo de verificado e o registro de quem aprovou.</summary>
    public Task<AdminBusinessDetailResponse> ApproveAsync(Guid businessId, string? note, CancellationToken ct = default) =>
        DecideAsync(businessId, (business, adminId, now) =>
        {
            business.Approve();
            business.Verify(adminId, Clean(note), now);
        }, ct);

    /// <summary>Em análise → rascunho, com o motivo. A nota é obrigatória: o dono precisa saber o que corrigir.</summary>
    public Task<AdminBusinessDetailResponse> RejectAsync(Guid businessId, string? note, CancellationToken ct = default) =>
        DecideAsync(businessId, (business, adminId, now) =>
        {
            business.RejectVerification(adminId, note?.Trim() ?? string.Empty, now);
            business.ReturnToDraft();
        }, ct);

    /// <summary>Ativo → suspenso. Some da busca e da vitrine (<see cref="Business.IsBookable"/>).</summary>
    public Task<AdminBusinessDetailResponse> SuspendAsync(Guid businessId, CancellationToken ct = default) =>
        DecideAsync(businessId, (business, _, _) => business.Suspend(), ct);

    /// <summary>Suspenso → ativo.</summary>
    public Task<AdminBusinessDetailResponse> ReinstateAsync(Guid businessId, CancellationToken ct = default) =>
        DecideAsync(businessId, (business, _, _) => business.Reactivate(), ct);

    private async Task<AdminBusinessDetailResponse> DecideAsync(
        Guid businessId, Action<Business, Guid, DateTimeOffset> decision, CancellationToken ct)
    {
        Guid adminId = actor.RequirePlatformAdmin();

        Business business = await businesses.GetByIdAsync(businessId, ct)
            ?? throw new DomainException("business.not_found");

        decision(business, adminId, clock.GetUtcNow());

        await unitOfWork.SaveChangesAsync(ct);
        return BusinessConverter.ToAdminDetail(business, await checklist.EvaluateAsync(business, ct), images);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
