using Booking.Application.Module.Identity.Queries;
using Booking.Arguments.Module.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Module.Identity;

[ApiController]
[Route("api/users")]
[Authorize]
public sealed class UsersController : ControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Me([FromServices] GetCurrentUserQuery query, CancellationToken ct)
    {
        string? sub = User.FindFirst("sub")?.Value;

        return Guid.TryParse(sub, out Guid userId) ? Ok(await query.ExecuteAsync(userId, ct)) : Unauthorized();
    }
}
