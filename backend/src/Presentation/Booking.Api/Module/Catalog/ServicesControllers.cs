using Booking.Api.Common;
using Booking.Application.Module.Catalog.Commands;
using Booking.Application.Module.Catalog.Queries;
using Booking.Arguments.Module.Catalog;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Booking.Api.Module.Catalog;

[ApiController]
[Route("api/businesses/current/services")]
[Authorize]
public sealed class ServicesController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<ServiceResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromServices] ListServicesQuery query, CancellationToken ct, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(new PageRequest(page, pageSize), ct));

    [HttpPost]
    [ProducesResponseType<ServiceResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(SaveServiceRequest request, [FromServices] CreateServiceCommand command, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await command.ExecuteAsync(request, ct));

    /// <summary>Foto do serviço: <c>multipart/form-data</c>, campo <c>file</c>. JPEG, PNG ou WebP, até 5 MB. Só o dono.</summary>
    [HttpPut("{serviceId:guid}/image")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ImageUpload.MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = ImageUpload.MaxRequestBytes)]
    [EnableRateLimiting(ImageUpload.RateLimitPolicy)]
    [ProducesResponseType<ServiceResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetImage(Guid serviceId, IFormFile? file, [FromServices] ServiceImageCommand command, CancellationToken ct)
    {
        await using Stream upload = ImageUpload.Open(file);
        return Ok(await command.SetAsync(serviceId, upload, ct));
    }

    [HttpDelete("{serviceId:guid}/image")]
    [ProducesResponseType<ServiceResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveImage(Guid serviceId, [FromServices] ServiceImageCommand command, CancellationToken ct) =>
        Ok(await command.RemoveAsync(serviceId, ct));

    [HttpPut("{serviceId:guid}")]
    [ProducesResponseType<ServiceResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid serviceId, SaveServiceRequest request, [FromServices] UpdateServiceCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(serviceId, request, ct));

    [HttpPut("{serviceId:guid}/professionals/{professionalId:guid}")]
    [ProducesResponseType<ServiceResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> EnableProfessional(
        Guid serviceId, Guid professionalId, EnableProfessionalRequest request, [FromServices] EnableProfessionalCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(serviceId, professionalId, request, ct));

    [HttpDelete("{serviceId:guid}/professionals/{professionalId:guid}")]
    public async Task<IActionResult> DisableProfessional(
        Guid serviceId, Guid professionalId, [FromServices] DisableProfessionalCommand command, CancellationToken ct)
    {
        await command.ExecuteAsync(serviceId, professionalId, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/businesses/{businessId:guid}/services")]
[AllowAnonymous]
public sealed class PublicServicesController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<PublicServiceResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        Guid businessId, [FromServices] ListPublicServicesQuery query, CancellationToken ct, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(businessId, new PageRequest(page, pageSize), ct));
}
