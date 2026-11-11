using Booking.Api.Common;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Application.Module.Tenancy.Queries;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Booking.Api.Module.Tenancy;

[ApiController]
[Route("api/businesses")]
[Authorize]
public sealed class BusinessesController : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting(RateLimits.BusinessCreate)]
    [ProducesResponseType<BusinessResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Register(
        RegisterBusinessRequest request, [FromServices] RegisterBusinessCommand command, CancellationToken ct)
    {
        string? sub = User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(sub, out Guid userId))
        {
            return Unauthorized();
        }

        BusinessResponse business = await command.ExecuteAsync(userId, request, ct);
        return CreatedAtAction(nameof(GetPublic), new { businessId = business.Id }, business);
    }

    /// <summary>
    /// "Sair do estabelecimento": profissional ou atendente remove o próprio vínculo; o perfil sai da vitrine na hora.
    /// O dono recebe 409 (<c>business_membership.cannot_remove_owner</c>). Depois, o token do painel deixa de valer
    /// para este estabelecimento nas rotas que conferem o vínculo: o frontend volta ao contexto de consumidor.
    /// </summary>
    [HttpPost("current/leave")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Leave([FromServices] LeaveBusinessCommand command, CancellationToken ct)
    {
        await command.ExecuteAsync(ct);
        return NoContent();
    }

    [HttpGet("current")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCurrent([FromServices] GetCurrentBusinessQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(ct));

    /// <summary>A checklist de envio e publicação (o que falta), só para o Owner.</summary>
    [HttpGet("current/checklist")]
    [ProducesResponseType<PagedResult<ChecklistItemResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChecklist([FromServices] GetCurrentChecklistQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(ct));

    /// <summary>A faixa de verificação do painel: checklist de envio, estado, motivo da decisão e se o botão já vale. Só o Owner.</summary>
    [HttpGet("current/verification")]
    [ProducesResponseType<VerificationResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVerification([FromServices] GetCurrentVerificationQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(ct));

    [HttpPut("current/scheduling-policy")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdatePolicy(
        UpdateSchedulingPolicyRequest request, [FromServices] UpdateSchedulingPolicyCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    [HttpPut("current/address")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateAddress(
        UpdateAddressRequest request, [FromServices] UpdateAddressCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    [HttpPut("current/location")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> ConfirmLocation(
        ConfirmLocationRequest request, [FromServices] ConfirmLocationCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    /// <summary>Logotipo: <c>multipart/form-data</c>, campo <c>file</c>. JPEG, PNG ou WebP, até 5 MB.</summary>
    [HttpPut("current/logo")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ImageUpload.MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = ImageUpload.MaxRequestBytes)]
    [EnableRateLimiting(ImageUpload.RateLimitPolicy)]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetLogo(IFormFile? file, [FromServices] BusinessImageCommand command, CancellationToken ct)
    {
        await using Stream upload = ImageUpload.Open(file);
        return Ok(await command.SetAsync(BusinessImageSlot.Logo, upload, ct));
    }

    [HttpDelete("current/logo")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveLogo([FromServices] BusinessImageCommand command, CancellationToken ct) =>
        Ok(await command.RemoveAsync(BusinessImageSlot.Logo, ct));

    /// <summary>Capa: <c>multipart/form-data</c>, campo <c>file</c>. JPEG, PNG ou WebP, até 5 MB.</summary>
    [HttpPut("current/cover")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ImageUpload.MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = ImageUpload.MaxRequestBytes)]
    [EnableRateLimiting(ImageUpload.RateLimitPolicy)]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetCover(IFormFile? file, [FromServices] BusinessImageCommand command, CancellationToken ct)
    {
        await using Stream upload = ImageUpload.Open(file);
        return Ok(await command.SetAsync(BusinessImageSlot.Cover, upload, ct));
    }

    [HttpDelete("current/cover")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveCover([FromServices] BusinessImageCommand command, CancellationToken ct) =>
        Ok(await command.RemoveAsync(BusinessImageSlot.Cover, ct));

    [HttpPost("current/submit")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Submit([FromServices] SubmitBusinessCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(ct));

    /// <summary>Responsável de Saúde e registro no conselho. Só o Owner; só o Admin lê.</summary>
    [HttpPut("current/responsible")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetResponsible(
        SetResponsibleRequest request, [FromServices] SetResponsibleCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    [HttpPost("current/terms")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> AcceptTerms(
        AcceptTermsRequest request, [FromServices] AcceptTermsCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(request, ct));

    /// <summary>Publica na hora (Beleza), com a checklist completa. Saúde responde <c>business.requires_review</c>.</summary>
    [HttpPost("current/publish")]
    [ProducesResponseType<BusinessDetailResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Publish([FromServices] PublishBusinessCommand command, CancellationToken ct) =>
        Ok(await command.ExecuteAsync(ct));

    /// <summary>
    /// "Denunciar" na página pública. Sem login; limite de taxa por IP. Cai na fila do Admin e responde 204; só se
    /// denuncia estabelecimento ativo (os outros respondem 404).
    /// </summary>
    [HttpPost("{businessId:guid}/reports")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimits.Report)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Report(
        Guid businessId, ReportBusinessRequest request, [FromServices] ReportBusinessCommand command, CancellationToken ct)
    {
        await command.ExecuteAsync(businessId, request, ct);
        return NoContent();
    }

    [HttpGet("{businessId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType<PublicBusinessResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublic(Guid businessId, [FromServices] GetPublicBusinessQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(businessId, ct));

    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType<PagedResult<BusinessSearchItemResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search(
        [FromQuery] SearchBusinessesRequest request, [FromServices] SearchBusinessesQuery query, CancellationToken ct) =>
        Ok(await query.ExecuteAsync(request, ct));
}
