using Booking.Api.Common;
using Booking.Application.Module.People.Commands;
using Booking.Application.Module.People.Queries;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Booking.Api.Module.People;

/// <summary>Página pública do profissional (ADR-031). Anônima: só profissional ativo de estabelecimento ativo.</summary>
[ApiController]
[Route("api/professionals")]
[AllowAnonymous]
public sealed class PublicProfessionalPageController : ControllerBase
{
    [HttpGet("{professionalId:guid}")]
    [ProducesResponseType<ProfessionalPageResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid professionalId, [FromServices] GetPublicProfessionalQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(professionalId, ct));

    /// <summary>"Solicitar remoção deste perfil": motivo e contato opcional, sem login. 5 por hora por IP.</summary>
    [HttpPost("{professionalId:guid}/removal-requests")]
    [EnableRateLimiting(RateLimits.Report)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RequestRemoval(
        Guid professionalId,
        RequestProfessionalRemovalRequest request,
        [FromServices] RequestProfessionalRemovalCommand command,
        CancellationToken ct)
    {
        await command.ExecuteAsync(professionalId, request, ct);
        return NoContent();
    }
}

/// <summary>Fila de pedidos de remoção de perfil do Admin da plataforma (ADR-020).</summary>
[ApiController]
[Route("api/admin/professional-removals")]
[Authorize(Policy = AuthorizationPolicies.PlatformAdmin)]
public sealed class AdminProfessionalRemovalsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<ProfessionalRemovalResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromServices] ListProfessionalRemovalRequestsQuery query,
        CancellationToken ct,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(status, new PageRequest(page, pageSize), ct));

    [HttpPost("{requestId:guid}/resolve")]
    [ProducesResponseType<ProfessionalRemovalResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Resolve(
        Guid requestId,
        ResolveProfessionalRemovalRequest request,
        [FromServices] ResolveProfessionalRemovalRequestCommand command,
        CancellationToken ct) =>
        Ok(await command.ExecuteAsync(requestId, request.Note, ct));
}
