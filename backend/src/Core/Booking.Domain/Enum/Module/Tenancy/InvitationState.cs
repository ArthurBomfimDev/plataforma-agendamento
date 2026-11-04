namespace Booking.Domain.Enum.Module.Tenancy;

/// <summary>Situação de um convite, derivada das datas: só <see cref="Pending"/> pode ser aceito ou reenviado.</summary>
public enum InvitationState
{
    Pending,
    Accepted,
    Revoked,
    Expired,
}
