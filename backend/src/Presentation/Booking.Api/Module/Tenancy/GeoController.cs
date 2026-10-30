using Booking.Application.Module.Tenancy.Queries;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Booking.Api.Module.Tenancy;

/// <summary>
/// Localização para a busca e para o cadastro do estabelecimento (Onda 6B, ADR-022). Rotas públicas, com limite por
/// IP: cada chamada pode ir a um provedor de terceiros com cota.
/// </summary>
[ApiController]
[Route("api/geo")]
[AllowAnonymous]
[EnableRateLimiting("geo")]
public sealed class GeoController : ControllerBase
{
    [HttpGet("postal-code/{postalCode}")]
    [ProducesResponseType<PostalCodeResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> PostalCode(
        string postalCode, [FromServices] LookupPostalCodeQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(postalCode, ct));

    /// <summary>Busca por endereço ou cidade. Só no envio: o Nominatim público proíbe autocomplete.</summary>
    [HttpGet("search")]
    [ProducesResponseType<PagedResult<GeoPlaceResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] string? q, [FromServices] SearchPlacesQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(q, ct));

    [HttpGet("reverse")]
    [ProducesResponseType<ReverseGeocodeResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Reverse(
        [FromQuery] double? lat, [FromQuery] double? lng, [FromServices] ReverseGeocodeQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(lat, lng, ct));
}
