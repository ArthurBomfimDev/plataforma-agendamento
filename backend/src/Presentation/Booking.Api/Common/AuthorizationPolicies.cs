using Booking.Application.Common.Tenancy;
using Microsoft.AspNetCore.Authorization;

namespace Booking.Api.Common;

public static class AuthorizationPolicies
{
    /// <summary>Admin da plataforma (ADR-020): exige a claim <c>platform=admin</c>, emitida só para quem tem o papel no banco.</summary>
    public const string PlatformAdmin = "PlatformAdmin";

    public static AuthorizationBuilder AddBookingPolicies(this AuthorizationBuilder builder) =>
        builder.AddPolicy(PlatformAdmin, policy => policy
            .RequireAuthenticatedUser()
            .RequireClaim(PlatformClaims.Role, PlatformClaims.AdminRole));
}
