using Booking.Application.Module.Catalog.Commands;
using Booking.Application.Module.Catalog.Queries;
using Booking.Arguments.Module.Catalog;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
