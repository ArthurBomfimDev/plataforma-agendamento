using Booking.Api.Common;
using Booking.Application.Module.People.Commands;
using Booking.Application.Module.People.Queries;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

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

    /// <summary>"Meu perfil": o profissional com conta lê o próprio perfil. Quem não tem perfil recebe 403.</summary>
    [HttpGet("me")]
    [ProducesResponseType<ProfessionalResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMine([FromServices] GetMyProfessionalProfileQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(ct));

    /// <summary>O profissional com conta edita a própria especialidade e bio (nome e situação são do dono).</summary>
    [HttpPut("me")]
    [ProducesResponseType<ProfessionalResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateMine(
        UpdateMyProfessionalProfileRequest request, [FromServices] UpdateMyProfessionalProfileCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    [HttpPut("{professionalId:guid}")]
    [ProducesResponseType<ProfessionalResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(
        Guid professionalId, UpdateProfessionalRequest request, [FromServices] UpdateProfessionalCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(professionalId, request, ct));

    /// <summary>Foto: o dono, ou o próprio profissional. <c>multipart/form-data</c>, campo <c>file</c>, até 5 MB.</summary>
    [HttpPut("{professionalId:guid}/photo")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ImageUpload.MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = ImageUpload.MaxRequestBytes)]
    [EnableRateLimiting(ImageUpload.RateLimitPolicy)]
    [ProducesResponseType<ProfessionalResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetPhoto(
        Guid professionalId, IFormFile? file, [FromServices] ProfessionalPhotoCommand command, CancellationToken ct)
    {
        await using Stream upload = ImageUpload.Open(file);
        return Ok(await command.SetAsync(professionalId, upload, ct));
    }

    [HttpDelete("{professionalId:guid}/photo")]
    [ProducesResponseType<ProfessionalResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RemovePhoto(
        Guid professionalId, [FromServices] ProfessionalPhotoCommand command, CancellationToken ct) =>
        Ok(await command.RemoveAsync(professionalId, ct));
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
