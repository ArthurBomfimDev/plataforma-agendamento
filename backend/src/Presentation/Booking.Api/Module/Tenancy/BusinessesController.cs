using Booking.Api.Common;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Application.Module.Tenancy.Queries;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Booking.Api.Module.Tenancy;

[ApiController]
[Route("api/businesses")]
[Authorize]
public sealed class BusinessesController : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<BusinessResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Register(
        RegisterBusinessRequest request, [FromServices] RegisterBusinessCommand command, CancellationToken ct)
    {
        string? sub = User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(sub, out Guid userId))
        {
            return Unauthorized();
        }

        BusinessResponse business = await command.ExecuteAsync(userId, request, ct);
        return CreatedAtAction(nameof(GetPublic), new { businessId = business.Id }, business);
    }

    [HttpGet("current")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCurrent([FromServices] GetCurrentBusinessQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(ct));

    [HttpPut("current/scheduling-policy")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdatePolicy(
        UpdateSchedulingPolicyRequest request, [FromServices] UpdateSchedulingPolicyCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    [HttpPut("current/address")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateAddress(
        UpdateAddressRequest request, [FromServices] UpdateAddressCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    [HttpPut("current/location")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> ConfirmLocation(
        ConfirmLocationRequest request, [FromServices] ConfirmLocationCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    /// <summary>Logotipo: <c>multipart/form-data</c>, campo <c>file</c>. JPEG, PNG ou WebP, até 5 MB.</summary>
    [HttpPut("current/logo")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ImageUpload.MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = ImageUpload.MaxRequestBytes)]
    [EnableRateLimiting(ImageUpload.RateLimitPolicy)]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetLogo(IFormFile? file, [FromServices] BusinessImageCommand command, CancellationToken ct)
    {
        await using Stream upload = ImageUpload.Open(file);
        return Ok(await command.SetAsync(BusinessImageSlot.Logo, upload, ct));
    }

    [HttpDelete("current/logo")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveLogo([FromServices] BusinessImageCommand command, CancellationToken ct) =>
        Ok(await command.RemoveAsync(BusinessImageSlot.Logo, ct));

    /// <summary>Capa: <c>multipart/form-data</c>, campo <c>file</c>. JPEG, PNG ou WebP, até 5 MB.</summary>
    [HttpPut("current/cover")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ImageUpload.MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = ImageUpload.MaxRequestBytes)]
    [EnableRateLimiting(ImageUpload.RateLimitPolicy)]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetCover(IFormFile? file, [FromServices] BusinessImageCommand command, CancellationToken ct)
    {
        await using Stream upload = ImageUpload.Open(file);
        return Ok(await command.SetAsync(BusinessImageSlot.Cover, upload, ct));
    }

    [HttpDelete("current/cover")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveCover([FromServices] BusinessImageCommand command, CancellationToken ct) =>
        Ok(await command.RemoveAsync(BusinessImageSlot.Cover, ct));

    [HttpPost("current/submit")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Submit([FromServices] SubmitBusinessCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(ct));

    [HttpGet("{businessId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType<PublicBusinessResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublic(Guid businessId, [FromServices] GetPublicBusinessQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(businessId, ct));

    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType<PagedResult<BusinessSearchItemResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] SearchBusinessesRequest request, [FromServices] SearchBusinessesQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(request, ct));
}
