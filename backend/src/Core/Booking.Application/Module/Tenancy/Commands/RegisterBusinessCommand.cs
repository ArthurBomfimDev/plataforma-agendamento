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
        if (await memberships.CountOwnedByUserAsync(ownerUserId, ct) >= Business.MaxPerAccount)
        {
            throw new DomainException("business.account_limit_reached");
        }

        Document document = Document.Of(request.Document);
        EnsureMatchesDeclaredType(document, request.DocumentType);

        if (!Enum.TryParse(request.Category, ignoreCase: true, out BusinessCategory category))
        {
            throw new DomainException("business.category_invalid");
        }

        if (await businesses.ExistsByDocumentAsync(document, ct))
        {
            throw new DomainException("business.document_already_registered");
        }

        Business business = Business.Create(request.Name, document, category, request.IsMei);
        businesses.Add(business);

        BusinessMembership owner = BusinessMembership.CreateOwner(business.Id, ownerUserId, clock.GetUtcNow());
        memberships.Add(owner);

        await unitOfWork.SaveChangesAsync(ct);

        return BusinessConverter.ToResponse(business);
    }

    /// <summary>
    /// Versão B (ADR-028): toda categoria aceita CPF ou CNPJ. Quem informa o tipo no assistente recebe o erro do campo
    /// certo se digitou o outro documento; sem o tipo, vale o que o documento é.
    /// </summary>
    private static void EnsureMatchesDeclaredType(Document document, string? declaredType)
    {
        if (string.IsNullOrWhiteSpace(declaredType))
        {
            return;
        }

        if (!Enum.TryParse(declaredType, ignoreCase: true, out DocumentKind declared) || !Enum.IsDefined(declared))
        {
            throw new DomainException("document.type_invalid");
        }

        if (declared != document.Kind)
        {
            throw new DomainException(declared == DocumentKind.Cpf ? "document.expected_cpf" : "document.expected_cnpj");
        }
    }
}
