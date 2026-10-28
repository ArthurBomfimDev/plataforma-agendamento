using Booking.Domain.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Common;

/// <summary>Traduz <see cref="DomainException"/> em ProblemDetails. O <c>code</c> é estável e é o que o frontend usa para traduzir.</summary>
public sealed class DomainExceptionHandler(IProblemDetailsService problemDetails) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken ct)
    {
        if (exception is not DomainException domain)
        {
            return false;
        }

        int status = StatusFor(domain.Code);
        httpContext.Response.StatusCode = status;

        var details = new ProblemDetails
        {
            Status = status,
            Title = domain.Code,
            Extensions = { ["code"] = domain.Code },
        };

        foreach ((string key, object? value) in domain.Details)
        {
            details.Extensions[key] = value;
        }

        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = details,
        });
    }

    private static int StatusFor(string code) => code switch
    {
        "auth.invalid_credentials" or "auth.invalid_refresh_token" or "auth.refresh_token_reused"
            or "auth.unauthenticated" => StatusCodes.Status401Unauthorized,
        "auth.account_not_active" or "identity.email_not_confirmed" or "auth.forbidden" or "tenant.missing"
            or "compliance.consent_required" => StatusCodes.Status403Forbidden,
        "user.email_already_registered" or "business.document_already_registered"
            or "appointment.slot_no_longer_available" or "customer.already_registered"
            or "work_schedule.overlaps" => StatusCodes.Status409Conflict,
        "appointment.contention_try_again" or "geo.provider_unavailable" => StatusCodes.Status503ServiceUnavailable,
        _ when code.EndsWith(".not_found", StringComparison.Ordinal) => StatusCodes.Status404NotFound,
        _ when code.Contains(".cannot_", StringComparison.Ordinal) => StatusCodes.Status409Conflict,
        _ => StatusCodes.Status400BadRequest,
    };
}
