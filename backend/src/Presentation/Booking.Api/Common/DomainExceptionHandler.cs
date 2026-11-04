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
            or "compliance.consent_required" or "appointment.customer_context_required" or "invitation.email_mismatch"
            or "review.not_allowed" => StatusCodes.Status403Forbidden,
        "user.email_already_registered" or "business.document_already_registered"
            or "appointment.slot_no_longer_available" or "customer.already_registered"
            or "work_schedule.overlaps" or "business.requires_review" or "business.account_limit_reached"
            or "business.seat_limit_reached" or "invitation.already_pending" or "invitation.already_member"
            or "invitation.account_exists" or "invitation.already_used" or "invitation.professional_not_linkable"
            or "review.already_reviewed" or "review.not_completed" or "review.window_expired" or "review.already_edited"
            or "review.edit_window_expired" => StatusCodes.Status409Conflict,
        "invitation.expired" or "invitation.revoked" => StatusCodes.Status410Gone,
        "appointment.contention_try_again" or "review.contention_try_again" or "geo.provider_unavailable" => StatusCodes.Status503ServiceUnavailable,
        "image.too_large" => StatusCodes.Status413PayloadTooLarge,
        "image.unsupported_type" => StatusCodes.Status415UnsupportedMediaType,
        _ when code.EndsWith(".not_found", StringComparison.Ordinal) => StatusCodes.Status404NotFound,
        _ when code.Contains(".cannot_", StringComparison.Ordinal) => StatusCodes.Status409Conflict,
        _ => StatusCodes.Status400BadRequest,
    };
}
