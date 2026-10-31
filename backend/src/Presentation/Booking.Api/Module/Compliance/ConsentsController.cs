using Booking.Application.Module.Compliance.Commands;
using Booking.Application.Module.Compliance.Queries;
using Booking.Arguments.Module.Compliance;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Module.Compliance;

[ApiController]
[Route("api/consents")]
[Authorize]
public sealed class ConsentsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<ConsentResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Mine(
        [FromServices] ListMyConsentsQuery query, CancellationToken ct, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(new PageRequest(page, pageSize), ct));

    [HttpGet("versions")]
    [AllowAnonymous]
    [ProducesResponseType<ConsentVersionsResponse>(StatusCodes.Status200OK)]
    public IActionResult Versions([FromServices] GetConsentVersionsQuery query) => Ok(query.Execute());

    [HttpPost]
    [ProducesResponseType<ConsentResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Grant(GrantConsentRequest request, [FromServices] GrantConsentCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    [HttpDelete("{purpose}")]
    public async Task<IActionResult> Revoke(string purpose, [FromServices] RevokeConsentCommand command, CancellationToken ct)
    {
        await command.ExecuteAsync(purpose, ct);
        return NoContent();
    }
}
