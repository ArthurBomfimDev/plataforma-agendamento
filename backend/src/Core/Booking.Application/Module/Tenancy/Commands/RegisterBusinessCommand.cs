using Booking.Application.Common.Persistence;
using Booking.Application.Module.Tenancy.Converter;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Domain.ValueObject;

namespace Booking.Application.Module.Tenancy.Commands;

public sealed class RegisterBusinessCommand(
    IBusinessRepository businesses,
    IBusinessMembershipRepository memberships,
    IUnitOfWork unitOfWork,
    TimeProvider clock)
{
    public async Task<BusinessResponse> ExecuteAsync(
        Guid ownerUserId, RegisterBusinessRequest request, CancellationToken ct = default)
    {
        Document document = Document.Of(request.Document);

        if (!Enum.TryParse(request.Category, ignoreCase: true, out BusinessCategory category))
        {
            throw new DomainException("business.category_invalid");
        }

        if (await businesses.ExistsByDocumentAsync(document, ct))
        {
            throw new DomainException("business.document_already_registered");
        }

        Business business = Business.Create(request.Name, document, category);
        businesses.Add(business);

        BusinessMembership owner = BusinessMembership.CreateOwner(business.Id, ownerUserId, clock.GetUtcNow());
        memberships.Add(owner);

        await unitOfWork.SaveChangesAsync(ct);

        return BusinessConverter.ToResponse(business);
    }
}
