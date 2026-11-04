using Booking.Api.Common;
using Booking.Application.Module.Reputation.Commands;
using Booking.Application.Module.Reputation.Queries;
using Booking.Arguments.Module.Reputation;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Booking.Api.Module.Reputation;

/// <summary>
/// A avaliação do consumidor sobre um agendamento concluído (ADR-032). Exige conta em contexto de consumidor: o token
/// de painel de estabelecimento recebe 403.
/// </summary>
[ApiController]
[Route("api/appointments/{appointmentId:guid}/review")]
[Authorize]
public sealed class AppointmentReviewController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<MyReviewResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid appointmentId, [FromServices] GetMyReviewQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(appointmentId, ct));

    [HttpPost]
    [EnableRateLimiting(RateLimits.Review)]
    [ProducesResponseType<MyReviewResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        Guid appointmentId,
        SaveReviewRequest request,
        [FromServices] CreateReviewCommand command,
        CancellationToken ct)
    {
        MyReviewResponse created = await command.ExecuteAsync(appointmentId, request, ct);
        return CreatedAtAction(nameof(Get), new { appointmentId }, created);
    }

    /// <summary>Uma única edição, em até 7 dias depois da avaliação.</summary>
    [HttpPut]
    [EnableRateLimiting(RateLimits.Review)]
    [ProducesResponseType<MyReviewResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid appointmentId,
        SaveReviewRequest request,
        [FromServices] UpdateReviewCommand command,
        CancellationToken ct) =>
        Ok(await command.ExecuteAsync(appointmentId, request, ct));
}

/// <summary>"Minhas avaliações" do consumidor.</summary>
[ApiController]
[Route("api/reviews/mine")]
[Authorize]
public sealed class MyReviewsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<MyReviewResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromServices] ListMyReviewsQuery query,
        CancellationToken ct,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(new PageRequest(page, pageSize), ct));
}

/// <summary>Avaliações e nota de um estabelecimento ativo. Anônimo: é vitrine.</summary>
[ApiController]
[Route("api/businesses/{businessId:guid}")]
[AllowAnonymous]
public sealed class PublicBusinessReviewsController : ControllerBase
{
    [HttpGet("reviews")]
    [ProducesResponseType<PagedResult<PublicReviewResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        Guid businessId,
        [FromServices] ListBusinessReviewsQuery query,
        CancellationToken ct,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await query.ExecuteAsync(businessId, new PageRequest(page, pageSize), ct));

    [HttpGet("rating")]
    [ProducesResponseType<RatingSummaryResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Rating(Guid businessId, [FromServices] GetBusinessRatingQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(businessId, ct));
}

/// <summary>Avaliações e nota de um profissional ativo. Anônimo: é vitrine.</summary>
[ApiController]
[Route("api/professionals/{professionalId:guid}")]
[AllowAnonymous]
public sealed class PublicProfessionalReviewsController : ControllerBase
{
    [HttpGet("reviews")]
    [ProducesResponseType<PagedResult<PublicReviewResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        Guid professionalId,
        [FromServices] ListProfessionalReviewsQuery query,
        CancellationToken ct,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10) =>
        Ok(await query.ExecuteAsync(professionalId, new PageRequest(page, pageSize), ct));

    [HttpGet("rating")]
    [ProducesResponseType<RatingSummaryResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Rating(Guid professionalId, [FromServices] GetProfessionalRatingQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(professionalId, ct));
}
