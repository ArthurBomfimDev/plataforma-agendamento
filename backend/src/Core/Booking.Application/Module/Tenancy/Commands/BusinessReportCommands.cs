using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Tenancy;

namespace Booking.Application.Module.Tenancy.Commands;

/// <summary>
/// "Denunciar" na página pública. Não exige conta (a rota tem limite de taxa por IP), e só se denuncia o que o público
/// vê: estabelecimento ativo. Cai na fila do Admin; nada é suspenso automaticamente.
/// </summary>
public sealed class ReportBusinessCommand(
    IBusinessRepository businesses,
    IBusinessReportRepository reports,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task ExecuteAsync(Guid businessId, ReportBusinessRequest request, CancellationToken ct = default)
    {
        Business? business = await businesses.GetByIdAsync(businessId, ct);

        if (business is not { IsBookable: true })
        {
            throw new DomainException("business.not_found");
        }

        reports.Add(BusinessReport.Create(businessId, request.Reason, actor.UserId, clock.GetUtcNow()));
        await unitOfWork.SaveChangesAsync(ct);
    }
}

/// <summary>Fila de denúncias do Admin, as abertas por padrão.</summary>
public sealed class ListBusinessReportsQuery(IBusinessReportRepository reports, IBusinessRepository businesses, IActorContext actor)
{
    public async Task<PagedResult<BusinessReportResponse>> ExecuteAsync(string? status, PageRequest page, CancellationToken ct = default)
    {
        actor.RequirePlatformAdmin();

        BusinessReportStatus filter = BusinessReportStatus.Open;
        if (!string.IsNullOrWhiteSpace(status) && !System.Enum.TryParse(status, ignoreCase: true, out filter))
        {
            throw new DomainException("report.status_invalid");
        }

        PagedResult<BusinessReport> result = await reports.ListByStatusAsync(filter, page, ct);
        var items = new List<BusinessReportResponse>(result.Items.Count);

        foreach (BusinessReport report in result.Items)
        {
            items.Add(await ToResponseAsync(report, businesses, ct));
        }

        return new PagedResult<BusinessReportResponse>(items, result.Page, result.PageSize, result.TotalCount);
    }

    internal static async Task<BusinessReportResponse> ToResponseAsync(BusinessReport report, IBusinessRepository businesses, CancellationToken ct)
    {
        string name = (await businesses.GetByIdAsync(report.BusinessId, ct))?.Name ?? string.Empty;

        return new BusinessReportResponse(
            report.Id,
            report.BusinessId,
            name,
            report.Reason,
            report.Status.ToString(),
            report.ReportedAt,
            report.ReporterUserId,
            report.ResolvedByUserId,
            report.ResolvedAt,
            report.Resolution);
    }
}

/// <summary>O Admin encerra uma denúncia; fica registrado quem decidiu e quando. Suspender é uma decisão à parte.</summary>
public sealed class ResolveBusinessReportCommand(
    IBusinessReportRepository reports,
    IBusinessRepository businesses,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<BusinessReportResponse> ExecuteAsync(Guid reportId, string? note, CancellationToken ct = default)
    {
        Guid adminId = actor.RequirePlatformAdmin();

        BusinessReport report = await reports.GetByIdAsync(reportId, ct)
            ?? throw new DomainException("report.not_found");

        report.Resolve(adminId, note, clock.GetUtcNow());
        await unitOfWork.SaveChangesAsync(ct);

        return await ListBusinessReportsQuery.ToResponseAsync(report, businesses, ct);
    }
}
