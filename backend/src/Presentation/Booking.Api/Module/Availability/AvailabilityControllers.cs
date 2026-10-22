using Booking.Application.Module.Availability.Commands;
using Booking.Application.Module.Availability.Queries;
using Booking.Arguments.Module.Availability;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Module.Availability;

[ApiController]
[Route("api/businesses/current/work-schedules")]
[Authorize]
public sealed class WorkSchedulesController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<WorkScheduleResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] Guid professionalId, [FromServices] ListWorkSchedulesQuery query, CancellationToken ct, [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        Ok(await query.ExecuteAsync(professionalId, new PageRequest(page, pageSize), ct));

    [HttpPost]
    [ProducesResponseType<WorkScheduleResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Add(AddWorkScheduleRequest request, [FromServices] AddWorkScheduleCommand command, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await command.ExecuteAsync(request, ct));

    [HttpDelete("{scheduleId:guid}")]
    public async Task<IActionResult> Remove(Guid scheduleId, [FromServices] RemoveWorkScheduleCommand command, CancellationToken ct)
    {
        await command.ExecuteAsync(scheduleId, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/businesses/current/schedule-exceptions")]
[Authorize]
public sealed class ScheduleExceptionsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<ScheduleExceptionResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromServices] ListScheduleExceptionsQuery query, CancellationToken ct, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(new PageRequest(page, pageSize), ct));

    [HttpPost]
    [ProducesResponseType<ScheduleExceptionResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Add(
        AddScheduleExceptionRequest request, [FromServices] AddScheduleExceptionCommand command, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await command.ExecuteAsync(request, ct));

    [HttpDelete("{exceptionId:guid}")]
    public async Task<IActionResult> Remove(Guid exceptionId, [FromServices] RemoveScheduleExceptionCommand command, CancellationToken ct)
    {
        await command.ExecuteAsync(exceptionId, ct);
        return NoContent();
    }
}

[ApiController]
[Route("api/businesses/{businessId:guid}/availability")]
[AllowAnonymous]
public sealed class PublicAvailabilityController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<AvailableSlotsResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(
        Guid businessId,
        [FromQuery] Guid serviceId,
        [FromQuery] Guid professionalId,
        [FromQuery] DateOnly date,
        [FromServices] GetAvailableSlotsQuery query,
        CancellationToken ct) =>
        Ok(await query.ExecuteAsync(businessId, serviceId, professionalId, date, ct));

    [HttpGet("calendar")]
    [ProducesResponseType<AvailabilityCalendarResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Calendar(
        Guid businessId,
        [FromQuery] Guid serviceId,
        [FromQuery] Guid professionalId,
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        [FromServices] GetAvailabilityCalendarQuery query,
        CancellationToken ct) =>
        Ok(await query.ExecuteAsync(businessId, serviceId, professionalId, from, to, ct));
}
