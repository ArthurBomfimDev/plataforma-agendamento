using Booking.Application.Contracts.Compliance;
using Booking.Domain.Entity.Module.Compliance;
using Booking.Domain.Enum.Module.Compliance;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Compliance;

namespace Booking.Application.Module.Compliance.Integration;

/// <summary>Versões vigentes dos textos. Mudou o texto, muda a versão — e o consentimento antigo deixa de valer.</summary>
public static class ConsentTexts
{
    public const string SensitiveSchedulingVersion = "2026-10-v1";

    public static string CurrentVersion(ConsentPurpose purpose) => purpose switch
    {
        ConsentPurpose.SensitiveScheduling => SensitiveSchedulingVersion,
        _ => throw new DomainException("consent.purpose_not_supported"),
    };
}

public sealed class ComplianceGateway(
    IConsentRecordRepository consents,
    ISensitiveAccessLogRepository accessLog) : IComplianceGateway
{
    public async Task<bool> HasSensitiveSchedulingConsentAsync(Guid userId, CancellationToken ct = default) =>
        (await consents.ListActiveAsync(userId, ConsentPurpose.SensitiveScheduling, ct))
            .Any(c => c.IsActiveFor(ConsentTexts.SensitiveSchedulingVersion));

    public void LogSensitiveAccess(Guid businessId, Guid actorUserId, Guid appointmentId, string action, DateTimeOffset now) =>
        accessLog.Add(SensitiveAccessLog.Record(businessId, actorUserId, appointmentId, action, now));
}
