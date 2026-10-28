using Booking.Application.Module.Scheduling.Commands;
using Booking.Application.Module.Scheduling.Queries;
using Booking.Arguments.Module.Scheduling;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Module.Scheduling;

/// <summary>Lado do consumidor.</summary>
[ApiController]
[Route("api/appointments")]
[Authorize]
public sealed class AppointmentsController : ControllerBase
{
    /// <summary>409 <c>appointment.slot_no_longer_available</c> traz <c>alternatives</c> com horários próximos.</summary>
    [HttpPost]
    [ProducesResponseType<AppointmentResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        RequestAppointmentRequest request, [FromServices] RequestAppointmentCommand command, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await command.ExecuteAsync(request, ct));

    [HttpGet("mine")]
    [ProducesResponseType<PagedResult<AppointmentResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Mine(
        [FromServices] ListMyAppointmentsQuery query, CancellationToken ct, [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(new PageRequest(page, pageSize), ct));

    [HttpPost("{appointmentId:guid}/cancel")]
    [ProducesResponseType<AppointmentResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Cancel(
        Guid appointmentId, ReasonRequest request, [FromServices] CancelMyAppointmentCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(appointmentId, request.Reason, ct));
}

/// <summary>Lado do estabelecimento: proprietário em toda a agenda, profissional na própria.</summary>
[ApiController]
[Route("api/businesses/current/appointments")]
[Authorize]
public sealed class BusinessAppointmentsController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<AppointmentResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Agenda(
        [FromQuery] DateOnly date,
        [FromServices] GetAgendaQuery query,
        CancellationToken ct,
        [FromQuery] Guid? professionalId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100) =>
        Ok(await query.ExecuteAsync(date, professionalId, new PageRequest(page, pageSize), ct));

    /// <summary><c>professionalId</c> filtra para o proprietário; para o profissional, vale sempre o próprio.</summary>
    [HttpGet("pending")]
    [ProducesResponseType<PagedResult<AppointmentResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Pending(
        [FromServices] ListPendingAppointmentsQuery query,
        CancellationToken ct,
        [FromQuery] Guid? professionalId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20) =>
        Ok(await query.ExecuteAsync(professionalId, new PageRequest(page, pageSize), ct));

    [HttpPost("counter")]
    [ProducesResponseType<AppointmentResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Counter(
        CounterAppointmentRequest request, [FromServices] CreateCounterAppointmentCommand command, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await command.ExecuteAsync(request, ct));

    [HttpPost("{appointmentId:guid}/confirm")]
    public async Task<IActionResult> Confirm(Guid appointmentId, [FromServices] ManageAppointmentCommand command, CancellationToken ct) =>
        Ok(await command.ConfirmAsync(appointmentId, ct));

    [HttpPost("{appointmentId:guid}/reject")]
    public async Task<IActionResult> Reject(
        Guid appointmentId, ReasonRequest request, [FromServices] ManageAppointmentCommand command, CancellationToken ct) =>
        Ok(await command.RejectAsync(appointmentId, request.Reason, ct));

    [HttpPost("{appointmentId:guid}/cancel")]
    public async Task<IActionResult> Cancel(
        Guid appointmentId, ReasonRequest request, [FromServices] ManageAppointmentCommand command, CancellationToken ct) =>
        Ok(await command.CancelAsync(appointmentId, request.Reason, ct));

    [HttpPost("{appointmentId:guid}/complete")]
    public async Task<IActionResult> Complete(Guid appointmentId, [FromServices] ManageAppointmentCommand command, CancellationToken ct) =>
        Ok(await command.CompleteAsync(appointmentId, ct));

    [HttpPost("{appointmentId:guid}/no-show")]
    public async Task<IActionResult> NoShow(Guid appointmentId, [FromServices] ManageAppointmentCommand command, CancellationToken ct) =>
        Ok(await command.MarkNoShowAsync(appointmentId, ct));
}
