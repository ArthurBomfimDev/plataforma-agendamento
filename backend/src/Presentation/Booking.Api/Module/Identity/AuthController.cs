using Booking.Application.Module.Identity.Commands;
using Booking.Arguments.Module.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Booking.Api.Module.Identity;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public sealed class AuthController : ControllerBase
{
    [HttpPost("register")]
    [ProducesResponseType<UserResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Register(
        RegisterUserRequest request, [FromServices] RegisterUserCommand command, CancellationToken ct)
    {
        UserResponse user = await command.ExecuteAsync(request, ct);
        return CreatedAtAction(nameof(UsersController.Me), "Users", null, user);
    }

    [HttpPost("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Login(
        LoginRequest request, [FromServices] LoginCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    [HttpPost("refresh")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Refresh(
        RefreshSessionRequest request, [FromServices] RefreshSessionCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        LogoutRequest request, [FromServices] LogoutCommand command, CancellationToken ct)
    {
        await command.ExecuteAsync(request, ct);
        return NoContent();
    }

    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(
        ConfirmEmailRequest request, [FromServices] ConfirmEmailCommand command, CancellationToken ct)
    {
        await command.ExecuteAsync(request, ct);
        return NoContent();
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request, [FromServices] ForgotPasswordCommand command, CancellationToken ct)
    {
        await command.ExecuteAsync(request, ct);
        return Accepted();
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request, [FromServices] ResetPasswordCommand command, CancellationToken ct)
    {
        await command.ExecuteAsync(request, ct);
        return NoContent();
    }
}
