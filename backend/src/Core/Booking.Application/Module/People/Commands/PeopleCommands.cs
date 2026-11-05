using Booking.Application.Common.Media;
using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.People.Converter;
using Booking.Arguments.Module.People;
using Booking.Domain.Entity.Module.People;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.People;

namespace Booking.Application.Module.People.Commands;

/// <summary>
/// A declaração do dono (ADR-031): para exibir bio de quem não tem conta, o dono declara ter a autorização da pessoa. O
/// que fica registrado é quem declarou, quando e a versão do texto. Quem tem conta controla os próprios dados e não
/// depende da declaração.
/// </summary>
internal static class OwnerDeclaration
{
    /// <param name="enforce">
    /// Falso ao desativar: quem sai da vitrine não exibe nada, então desativar nunca pode ser barrado por falta de declaração
    /// (também vale para o cadastro antigo, anterior à declaração).
    /// </param>
    public static void Apply(Professional professional, bool declared, Guid ownerUserId, DateTimeOffset now, bool enforce = true)
    {
        if (declared && professional.RequiresOwnerDeclaration)
        {
            professional.DeclareAuthorization(ownerUserId, now);
        }

        if (enforce
            && professional.RequiresOwnerDeclaration
            && !string.IsNullOrWhiteSpace(professional.Bio)
            && !professional.HasAuthorizationDeclaration)
        {
            throw new DomainException("professional.declaration_required");
        }
    }
}

/// <summary>
/// O perfil do próprio dono, quando ele também atende. Para qualquer outra pessoa o caminho é o convite: o registro de
/// profissional só nasce quando ela aceita, e quem aceita controla os próprios dados.
/// </summary>
public sealed class CreateProfessionalCommand(
    IProfessionalRepository professionals,
    IBusinessDirectory businesses,
    IActorContext actor,
    IUnitOfWork unitOfWork,
    IImageUrls images)
{
    public async Task<ProfessionalResponse> ExecuteAsync(CreateProfessionalRequest request, CancellationToken ct = default)
    {
        Guid businessId = actor.RequireOwner();
        Guid userId = actor.RequireUserId();

        if (!request.IsMe)
        {
            throw new DomainException("professional.cannot_create_without_invitation");
        }

        // O vínculo nunca vem da requisição: só o da própria conta, conferido aqui.
        BusinessMembershipInfo membership = await businesses.FindActiveMembershipAsync(businessId, userId, ct)
            ?? throw new DomainException("auth.forbidden");

        Professional professional = Professional.Create(businessId, request.DisplayName, request.Specialty, request.Bio, membership.MembershipId);
        professional.SetRegistration(request.Registration);
        professionals.Add(professional);

        await unitOfWork.SaveChangesAsync(ct);
        return PeopleConverter.ToResponse(professional, images);
    }
}

public sealed class UpdateProfessionalCommand(
    IProfessionalRepository professionals, IActorContext actor, IUnitOfWork unitOfWork, TimeProvider clock, IImageUrls images)
{
    public async Task<ProfessionalResponse> ExecuteAsync(Guid professionalId, UpdateProfessionalRequest request, CancellationToken ct = default)
    {
        actor.RequireOwner();
        Guid userId = actor.RequireUserId();

        Professional professional = await professionals.GetByIdAsync(professionalId, ct)
            ?? throw new DomainException("professional.not_found");

        professional.UpdateProfile(request.DisplayName, request.Specialty, request.Bio);
        professional.SetRegistration(request.Registration);
        OwnerDeclaration.Apply(professional, request.AuthorizationDeclared, userId, clock.GetUtcNow(), enforce: request.IsActive);

        if (request.IsActive)
        {
            professional.Activate();
        }
        else
        {
            professional.Deactivate();
        }

        await unitOfWork.SaveChangesAsync(ct);
        return PeopleConverter.ToResponse(professional, images);
    }
}

public sealed class RegisterCustomerCommand(ICustomerRepository customers, IActorContext actor, IUnitOfWork unitOfWork, TimeProvider clock)
{
    public async Task<CustomerResponse> ExecuteAsync(RegisterCustomerRequest request, CancellationToken ct = default)
    {
        Guid userId = actor.RequireUserId();

        if (await customers.GetByUserIdAsync(userId, ct) is not null)
        {
            throw new DomainException("customer.already_registered");
        }

        Customer customer = Customer.Create(userId, request.BirthDate, request.SocialName, DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime));
        customers.Add(customer);

        await unitOfWork.SaveChangesAsync(ct);
        return PeopleConverter.ToResponse(customer);
    }
}
