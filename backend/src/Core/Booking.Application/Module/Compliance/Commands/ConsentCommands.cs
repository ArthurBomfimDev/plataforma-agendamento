using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Module.Compliance.Integration;
using Booking.Arguments.Module.Compliance;
using Booking.Domain.Entity.Module.Compliance;
using Booking.Domain.Enum.Module.Compliance;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Compliance;

namespace Booking.Application.Module.Compliance.Commands;

public sealed class GrantConsentCommand(IConsentRecordRepository consents, IActorContext actor, IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task<ConsentResponse> ExecuteAsync(GrantConsentRequest r, CancellationToken ct = default)
    {
        Guid userId = actor.RequireUserId();
        ConsentPurpose purpose = ParsePurpose(r.Purpose);

        // O consentimento é do texto que a pessoa leu: versão diferente da vigente não vale.
        if (r.Version != ConsentTexts.CurrentVersion(purpose))
        {
            throw new DomainException("consent.version_outdated");
        }

        IReadOnlyList<ConsentRecord> active = await consents.ListActiveAsync(userId, purpose, ct);
        ConsentRecord? current = active.FirstOrDefault(c => c.IsActiveFor(r.Version));

        if (current is null)
        {
            current = ConsentRecord.Grant(userId, purpose, r.Version, clock.GetUtcNow());
            consents.Add(current);
            await unitOfWork.SaveChangesAsync(ct);
        }

        return ToResponse(current);
    }

    internal static ConsentPurpose ParsePurpose(string purpose) =>
        System.Enum.TryParse(purpose, ignoreCase: true, out ConsentPurpose parsed)
            ? parsed
            : throw new DomainException("consent.purpose_invalid");

    internal static ConsentResponse ToResponse(ConsentRecord c) =>
        new(c.Id, c.Purpose.ToString(), c.Version, c.GrantedAt, c.RevokedAt);
}

public sealed class RevokeConsentCommand(IConsentRecordRepository consents, IActorContext actor, IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task ExecuteAsync(string purpose, CancellationToken ct = default)
    {
        Guid userId = actor.RequireUserId();
        DateTimeOffset now = clock.GetUtcNow();

        foreach (ConsentRecord record in await consents.ListActiveAsync(userId, GrantConsentCommand.ParsePurpose(purpose), ct))
        {
            record.Revoke(now);
        }

        await unitOfWork.SaveChangesAsync(ct);
    }
}
