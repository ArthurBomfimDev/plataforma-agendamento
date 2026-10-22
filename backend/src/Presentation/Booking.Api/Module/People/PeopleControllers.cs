using Booking.Application.Module.People.Commands;
using Booking.Application.Module.People.Queries;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Module.People;

[ApiController]
[Route("api/businesses/current/professionals")]
[Authorize]
public sealed class ProfessionalsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<ProfessionalResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromServices] ListProfessionalsQuery query, CancellationToken ct, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(new PageRequest(page, pageSize), ct));

    [HttpPost]
    [ProducesResponseType<ProfessionalResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        CreateProfessionalRequest request, [FromServices] CreateProfessionalCommand command, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await command.ExecuteAsync(request, ct));

    [HttpPut("{professionalId:guid}")]
    [ProducesResponseType<ProfessionalResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid professionalId, UpdateProfessionalRequest request, [FromServices] UpdateProfessionalCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(professionalId, request, ct));

    /// <summary>Dado pelo próprio profissional, nunca pelo dono.</summary>
    [HttpPut("{professionalId:guid}/public-profile-consent")]
    [ProducesResponseType<ProfessionalResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GrantConsent(
        Guid professionalId, [FromServices] SetPublicProfileConsentCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(professionalId, granted: true, ct));

    [HttpDelete("{professionalId:guid}/public-profile-consent")]
    [ProducesResponseType<ProfessionalResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RevokeConsent(
        Guid professionalId, [FromServices] SetPublicProfileConsentCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(professionalId, granted: false, ct));
}

[ApiController]
[Route("api/businesses/{businessId:guid}/professionals")]
[AllowAnonymous]
public sealed class PublicProfessionalsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<PublicProfessionalResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        Guid businessId, [FromServices] ListPublicProfessionalsQuery query, CancellationToken ct, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(businessId, new PageRequest(page, pageSize), ct));
}

[ApiController]
[Route("api/customers/me")]
[Authorize]
public sealed class CustomersController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<CustomerResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get([FromServices] GetMyCustomerProfileQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(ct));

    [HttpPost]
    [ProducesResponseType<CustomerResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Register(
        RegisterCustomerRequest request, [FromServices] RegisterCustomerCommand command, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await command.ExecuteAsync(request, ct));
}
