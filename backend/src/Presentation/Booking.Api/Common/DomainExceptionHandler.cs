using Booking.Domain.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Booking.Api.Common;

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

        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = status,
                Title = domain.Code,
                Extensions = { ["code"] = domain.Code },
            },
        });
    }

    private static int StatusFor(string code) => code switch
    {
        "auth.invalid_credentials" or "auth.invalid_refresh_token" or "auth.refresh_token_reused" => StatusCodes.Status401Unauthorized,
        "auth.account_not_active" => StatusCodes.Status403Forbidden,
        "user.email_already_registered" => StatusCodes.Status409Conflict,
        "user.not_found" => StatusCodes.Status404NotFound,
        _ => StatusCodes.Status400BadRequest,
    };
}
