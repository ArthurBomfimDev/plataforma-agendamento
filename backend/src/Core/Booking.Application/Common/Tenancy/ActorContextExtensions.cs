using Booking.Domain.Exceptions;

namespace Booking.Application.Common.Tenancy;

public static class ActorContextExtensions
{
    public const string OwnerRole = "Owner";
    public const string ProfessionalRole = "Professional";

    public static Guid RequireUserId(this IActorContext actor) =>
        actor.UserId ?? throw new DomainException("auth.unauthenticated");

    public static Guid RequireBusinessId(this IActorContext actor) =>
        actor.BusinessId ?? throw new DomainException("tenant.missing");

    /// <summary>Exige contexto de estabelecimento com papel de proprietário.</summary>
    public static Guid RequireOwner(this IActorContext actor)
    {
        Guid businessId = actor.RequireBusinessId();

        if (actor.BusinessRole != OwnerRole)
        {
            throw new DomainException("auth.forbidden");
        }

        return businessId;
    }

    public static bool IsOwner(this IActorContext actor) => actor.BusinessRole == OwnerRole;
}
