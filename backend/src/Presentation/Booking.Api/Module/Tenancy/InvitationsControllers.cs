using Booking.Api.Common;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Booking.Api.Module.Tenancy;

/// <summary>Convites de equipe, do lado do dono. Só o Owner convida, reenvia e revoga.</summary>
[ApiController]
[Route("api/businesses/current")]
[Authorize]
public sealed class BusinessInvitationsController : ControllerBase
{
    [HttpGet("invitations")]
    [ProducesResponseType<PagedResult<InvitationResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromServices] ListInvitationsQuery query, CancellationToken ct, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(new PageRequest(page, pageSize), ct));

    [HttpGet("seats")]
    [ProducesResponseType<SeatsResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSeats([FromServices] GetSeatsQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(ct));

    [HttpPost("invitations")]
    [EnableRateLimiting(RateLimits.InvitationSend)]
    [ProducesResponseType<InvitationResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Invite(
        InviteMemberRequest request, [FromServices] InviteMemberCommand command, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await command.ExecuteAsync(request, ct));

    [HttpPost("invitations/{invitationId:guid}/resend")]
    [EnableRateLimiting(RateLimits.InvitationSend)]
    [ProducesResponseType<InvitationResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Resend(
        Guid invitationId, [FromServices] ResendInvitationCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(invitationId, ct));

    [HttpDelete("invitations/{invitationId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Revoke(
        Guid invitationId, [FromServices] RevokeInvitationCommand command, CancellationToken ct)
    {
        await command.ExecuteAsync(invitationId, ct);
        return NoContent();
    }
}

/// <summary>
/// Rotas do link do convite. O token vai no corpo (<c>POST</c>), nunca na URL, para não cair em log de acesso nem em
/// histórico. A prévia e o aceite com conta nova são anônimos; o aceite de quem já tem conta exige login.
/// </summary>
[ApiController]
[Route("api/invitations")]
public sealed class InvitationsController : ControllerBase
{
    [HttpPost("preview")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimits.InvitationLink)]
    [ProducesResponseType<InvitationPreviewResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Preview(
        InvitationTokenRequest request, [FromServices] PreviewInvitationQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(request, ct));

    [HttpPost("accept")]
    [Authorize]
    [EnableRateLimiting(RateLimits.InvitationLink)]
    [ProducesResponseType<AcceptedInvitationResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Accept(
        AcceptInvitationRequest request, [FromServices] AcceptInvitationCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    [HttpPost("accept-new-account")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimits.InvitationLink)]
    [ProducesResponseType<AcceptedInvitationResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> AcceptWithNewAccount(
        AcceptInvitationNewAccountRequest request, [FromServices] AcceptInvitationWithNewAccountCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));
}
