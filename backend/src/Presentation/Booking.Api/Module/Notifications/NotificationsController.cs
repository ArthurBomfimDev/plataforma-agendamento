using Booking.Application.Module.Notifications.Commands;
using Booking.Application.Module.Notifications.Queries;
using Booking.Arguments.Module.Notifications;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Module.Notifications;

/// <summary>O sino do aplicativo. O lado (consumidor ou painel) vem do token, nunca da rota.</summary>
[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<NotificationResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Mine(
        [FromServices] ListMyNotificationsQuery query, CancellationToken ct, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(new PageRequest(page, pageSize), ct));

    [HttpGet("unread-count")]
    [ProducesResponseType<UnreadCountResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Unread([FromServices] CountMyUnreadNotificationsQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(ct));

    [HttpPost("{id:guid}/read")]
    [ProducesResponseType<NotificationResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Read(Guid id, [FromServices] MarkNotificationReadCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(id, ct));

    [HttpPost("read-all")]
    [ProducesResponseType<UnreadCountResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> ReadAll([FromServices] MarkAllNotificationsReadCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(ct));
}
