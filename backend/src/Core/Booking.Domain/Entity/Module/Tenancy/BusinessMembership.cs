using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.Tenancy;

public sealed class BusinessMembership : BaseEntity, IAuditable, ITenantScoped
{
    public Guid BusinessId { get; private set; }
    public Guid UserId { get; private set; }
    public BusinessMembershipRole Role { get; private set; }
    public BusinessMembershipStatus Status { get; private set; }
    public DateTimeOffset? AcceptedAt { get; private set; }
    public DateTimeOffset? RemovedAt { get; private set; }

    private BusinessMembership()
    {
    }

    public static BusinessMembership CreateOwner(Guid businessId, Guid userId, DateTimeOffset now)
    {
        return new BusinessMembership
        {
            BusinessId = businessId,
            UserId = userId,
            Role = BusinessMembershipRole.Owner,
            Status = BusinessMembershipStatus.Active,
            AcceptedAt = now,
        };
    }

    public static BusinessMembership Invite(Guid businessId, Guid userId, BusinessMembershipRole role)
    {
        if (role == BusinessMembershipRole.Owner)
        {
            throw new DomainException("business_membership.cannot_invite_as_owner");
        }

        return new BusinessMembership
        {
            BusinessId = businessId,
            UserId = userId,
            Role = role,
            Status = BusinessMembershipStatus.Invited,
        };
    }

    public void Accept(DateTimeOffset now)
    {
        if (Status != BusinessMembershipStatus.Invited)
        {
            throw new DomainException("business_membership.cannot_accept_from_current_status");
        }

        Status = BusinessMembershipStatus.Active;
        AcceptedAt = now;
    }

    public void Remove(DateTimeOffset now)
    {
        if (Status == BusinessMembershipStatus.Removed)
        {
            throw new DomainException("business_membership.already_removed");
        }

        if (Role == BusinessMembershipRole.Owner)
        {
            throw new DomainException("business_membership.cannot_remove_owner");
        }

        Status = BusinessMembershipStatus.Removed;
        RemovedAt = now;
    }
}
