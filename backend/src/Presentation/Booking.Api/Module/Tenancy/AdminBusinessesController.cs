using Booking.Api.Common;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Application.Module.Tenancy.Queries;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Module.Tenancy;

/// <summary>
/// Fila de análise do Admin da plataforma (ADR-020). Fora do tenant: o Admin vê estabelecimentos de qualquer
/// tenant, e por isso a rota não é <c>businesses/current</c>.
/// </summary>
[ApiController]
[Route("api/admin/businesses")]
[Authorize(Policy = AuthorizationPolicies.PlatformAdmin)]
public sealed class AdminBusinessesController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<BusinessResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromServices] ListBusinessesForAdminQuery query,
        CancellationToken ct,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(status, new PageRequest(page, pageSize), ct));

    [HttpGet("{businessId:guid}")]
    [ProducesResponseType<AdminBusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Detail(Guid businessId, [FromServices] GetBusinessForAdminQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(businessId, ct));

    [HttpPost("{businessId:guid}/approve")]
    [ProducesResponseType<AdminBusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Approve(
        Guid businessId, AdminDecisionRequest request, [FromServices] AdminBusinessCommands commands, CancellationToken ct) =>
        Ok(await commands.ApproveAsync(businessId, request.Note, ct));

    /// <summary>Volta para rascunho. Sem nota, 400 <c>business.verification_rejection_requires_note</c>.</summary>
    [HttpPost("{businessId:guid}/reject")]
    [ProducesResponseType<AdminBusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Reject(
        Guid businessId, AdminDecisionRequest request, [FromServices] AdminBusinessCommands commands, CancellationToken ct) =>
        Ok(await commands.RejectAsync(businessId, request.Note, ct));

    [HttpPost("{businessId:guid}/suspend")]
    [ProducesResponseType<AdminBusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Suspend(Guid businessId, [FromServices] AdminBusinessCommands commands, CancellationToken ct) =>
        Ok(await commands.SuspendAsync(businessId, ct));

    [HttpPost("{businessId:guid}/reinstate")]
    [ProducesResponseType<AdminBusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Reinstate(Guid businessId, [FromServices] AdminBusinessCommands commands, CancellationToken ct) =>
        Ok(await commands.ReinstateAsync(businessId, ct));
}
