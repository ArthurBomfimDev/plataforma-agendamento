using System.Reflection;
using Booking.Application.Common.Tenancy;
using Booking.Application.Module.Availability.Commands;
using Booking.Application.Module.Scheduling.Commands;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Domain.Exceptions;

namespace Booking.UnitTests.Tenancy;

/// <summary>
/// Política de autorização por papel (Fase 4, bloco 2), provada em cada caso de uso do lado do estabelecimento: com o
/// papel errado, a primeira coisa que o caso de uso faz é recusar (<c>auth.forbidden</c>, que a API responde como 403),
/// antes de tocar em qualquer repositório. Os repositórios aqui são nulos de propósito: se o comando os tocasse antes de
/// conferir o papel, o teste quebraria com <see cref="NullReferenceException"/>.
/// </summary>
/// <remarks>
/// A lista de classificação é fechada: um comando ou consulta novo sem classe aqui reprova
/// <see cref="Every_use_case_is_classified"/>. Quem cria um caso de uso decide, na hora, quem pode chamá-lo.
/// </remarks>
public sealed class RolePolicyTests
{
    private static readonly Assembly _application = typeof(CurrentBusinessLoader).Assembly;

    /// <summary>Só o dono: serviços, equipe, jornadas, convites, configurações, fotos do estabelecimento e publicação.</summary>
    private static readonly string[] _ownerOnly =
    [
        "AddWorkScheduleCommand", "UpdateWorkScheduleCommand", "RemoveWorkScheduleCommand",
        "CreateServiceCommand", "UpdateServiceCommand", "EnableProfessionalCommand", "DisableProfessionalCommand",
        "CreateProfessionalCommand", "UpdateProfessionalCommand",
        "InviteMemberCommand", "ResendInvitationCommand", "RevokeInvitationCommand", "ListInvitationsQuery", "GetSeatsQuery",
        "UpdateSchedulingPolicyCommand", "UpdateAddressCommand", "ConfirmLocationCommand", "SetResponsibleCommand",
        "AcceptTermsCommand", "PublishBusinessCommand", "SubmitBusinessCommand",
        "GetCurrentBusinessQuery", "GetCurrentChecklistQuery", "BusinessImageCommand",
    ];

    /// <summary>
    /// Bloqueios, férias e a prévia do que um bloqueio afeta: dono e atendente, de todos; o profissional, só os próprios
    /// (<c>AgendaScope</c>, provado com repositórios de mentira em <c>AgendaScopeTests</c>).
    /// </summary>
    private static readonly string[] _agendaScoped =
    [
        "AddScheduleExceptionCommand", "RemoveScheduleExceptionCommand", "PreviewAffectedAppointmentsQuery", "AffectedAppointmentsService",
        "AgendaScope",
    ];

    /// <summary>Só o Admin da plataforma.</summary>
    private static readonly string[] _platformAdmin =
    [
        "AdminBusinessCommands", "ListBusinessesForAdminQuery", "GetBusinessForAdminQuery",
        "ListBusinessReportsQuery", "ResolveBusinessReportCommand",
    ];

    /// <summary>
    /// Casos de uso que passam pelo <c>AppointmentAccess</c> (dono e atendente veem tudo, o profissional só o próprio) ou que
    /// leem dados que a equipe toda precisa para trabalhar. Cobertos por <see cref="Attendant_and_owner_see_every_professional_agenda"/>.
    /// </summary>
    private static readonly string[] _staffScoped =
    [
        "GetAgendaQuery", "ListPendingAppointmentsQuery", "CreateCounterAppointmentCommand", "ManageAppointmentCommand",
        "ListProfessionalsQuery", "ListServicesQuery", "ListWorkSchedulesQuery", "ListScheduleExceptionsQuery",
        "ProfessionalPhotoCommand",
        // "Meu perfil": só quem tem perfil de profissional ligado à conta (provado em MyProfessionalProfileTests).
        "GetMyProfessionalProfileQuery", "UpdateMyProfessionalProfileCommand",
    ];

    /// <summary>
    /// Conta, consumidor, rotas públicas e apoio interno: não dependem do papel no estabelecimento (cada um tem a própria
    /// regra: login, dono da conta, link do convite, estabelecimento ativo).
    /// </summary>
    private static readonly string[] _notRoleBased =
    [
        // Identity
        "ConfirmEmailCommand", "ForgotPasswordCommand", "LoginCommand", "LogoutCommand", "UpdateMyAccountCommand",
        "ChangeMyPasswordCommand", "RefreshSessionCommand", "RegisterUserCommand", "ResendConfirmationCommand",
        "ResetPasswordCommand", "SessionIssuer", "SwitchContextCommand", "GetCurrentUserQuery",
        // Consumidor e conformidade
        "GrantConsentCommand", "RevokeConsentCommand", "ListMyConsentsQuery", "GetConsentVersionsQuery",
        "RegisterCustomerCommand", "GetMyCustomerProfileQuery", "RequestAppointmentCommand", "CancelMyAppointmentCommand",
        "ListMyAppointmentsQuery", "RegisterBusinessCommand",
        // Público
        "GetAvailableSlotsQuery", "GetAvailabilityCalendarQuery", "ListPublicServicesQuery", "ListPublicProfessionalsQuery",
        "GetPublicBusinessQuery", "SearchBusinessesQuery", "ReportBusinessCommand", "LookupPostalCodeQuery",
        "SearchPlacesQuery", "ReverseGeocodeQuery", "PreviewInvitationQuery", "AcceptInvitationCommand",
        "AcceptInvitationWithNewAccountCommand",
        // Apoio interno (não é rota)
        "AppointmentAccess", "CustomerNameResolver", "SlotGuard", "ActivationChecklist", "CurrentBusinessLoader",
        "InvitationAcceptance", "DispatchOutboxCommand", "ExpirePendingAppointmentsCommand",
    ];

    private static readonly string[] _forbiddenRolesInBusiness = ["Attendant", "Professional"];

    private static IEnumerable<Type> UseCaseTypes() =>
        _application.GetExportedTypes().Where(t =>
            t is { IsClass: true, IsAbstract: false }
            && t.Namespace is not null
            && (t.Namespace.EndsWith(".Commands", StringComparison.Ordinal) || t.Namespace.EndsWith(".Queries", StringComparison.Ordinal))
            && t.Namespace.Contains(".Module.", StringComparison.Ordinal)
            && AsyncMethods(t).Any());

    private static IEnumerable<MethodInfo> AsyncMethods(Type type) =>
        type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Where(m => !m.IsSpecialName && typeof(Task).IsAssignableFrom(m.ReturnType));

    private static Type Resolve(string name) =>
        _application.GetExportedTypes().SingleOrDefault(t => t.Name == name)
        ?? throw new InvalidOperationException($"Classe '{name}' listada em RolePolicyTests não existe mais: remova ou renomeie.");

    public static TheoryData<string, string> OwnerOnlyCalls()
    {
        var data = new TheoryData<string, string>();
        foreach (string name in _ownerOnly)
        {
            foreach (string role in _forbiddenRolesInBusiness)
            {
                data.Add(name, role);
            }
        }

        return data;
    }

    [Fact]
    public void Every_use_case_is_classified()
    {
        HashSet<string> classified =
        [
            .. _ownerOnly, .. _agendaScoped, .. _platformAdmin, .. _staffScoped, .. _notRoleBased,
        ];

        string[] missing = [.. UseCaseTypes().Select(t => t.Name).Where(n => !classified.Contains(n)).Order()];

        Assert.True(missing.Length == 0, "Caso de uso sem classificação de papel: " + string.Join(", ", missing));
    }

    [Fact]
    public void Every_classified_name_exists_and_appears_in_exactly_one_list()
    {
        string[] all = [.. _ownerOnly, .. _agendaScoped, .. _platformAdmin, .. _staffScoped, .. _notRoleBased];

        Assert.Equal(all.Length, all.Distinct().Count());
        Assert.All(all, name => Resolve(name));
    }

    [Theory]
    [MemberData(nameof(OwnerOnlyCalls))]
    public async Task An_owner_only_use_case_refuses_attendant_and_professional_before_touching_anything(string typeName, string role)
    {
        Type type = Resolve(typeName);

        foreach (MethodInfo method in AsyncMethods(type))
        {
            Exception? error = await CallAsync(type, method, new Actor(role, inBusiness: true));

            Assert.True(
                error is DomainException { Code: "auth.forbidden" },
                $"{typeName}.{method.Name} com papel {role} devia responder auth.forbidden, mas deu: {error?.GetType().Name}: {error?.Message}");
        }
    }

    [Theory]
    [InlineData("Owner")]
    [InlineData("Attendant")]
    [InlineData("Professional")]
    public async Task Platform_admin_use_cases_refuse_every_business_role(string role)
    {
        foreach (string name in _platformAdmin)
        {
            Type type = Resolve(name);

            foreach (MethodInfo method in AsyncMethods(type))
            {
                Exception? error = await CallAsync(type, method, new Actor(role, inBusiness: true));

                Assert.True(
                    error is DomainException { Code: "auth.forbidden" },
                    $"{name}.{method.Name} com papel {role} devia responder auth.forbidden, mas deu: {error?.GetType().Name}: {error?.Message}");
            }
        }
    }

    [Theory]
    [InlineData("Owner")]
    [InlineData("Attendant")]
    public async Task Agenda_scoped_use_cases_let_owner_and_attendant_past_the_scope(string role)
    {
        foreach (string name in _agendaScoped)
        {
            Type type = Resolve(name);

            foreach (MethodInfo method in AsyncMethods(type))
            {
                Exception? error = await CallAsync(type, method, new Actor(role, inBusiness: true));

                // Passou da checagem de papel e tropeçou nas dependências nulas do teste: é a prova de que não foi barrado.
                Assert.False(
                    error is DomainException { Code: "auth.forbidden" },
                    $"{name}.{method.Name} barrou o papel {role}, que deveria operar a agenda.");
            }
        }
    }

    [Theory]
    [InlineData("Owner")]
    [InlineData("Attendant")]
    public async Task Attendant_and_owner_see_every_professional_agenda(string role)
    {
        var access = new AppointmentAccess(null!, null!, null!, null!, new Actor(role, inBusiness: true), TimeProvider.System);

        // Nulo = sem restrição a um profissional. Se consultasse o vínculo (dependência nula), quebraria.
        Assert.Null(await access.RestrictToProfessionalAsync(CancellationToken.None));
    }

    [Fact]
    public async Task A_professional_is_restricted_to_the_own_agenda_so_it_looks_up_the_membership()
    {
        var access = new AppointmentAccess(null!, null!, null!, null!, new Actor("Professional", inBusiness: true), TimeProvider.System);

        // Consulta o vínculo (dependência nula no teste): prova que NÃO caiu no atalho de "vê tudo".
        await Assert.ThrowsAsync<NullReferenceException>(() => access.RestrictToProfessionalAsync(CancellationToken.None));
    }

    [Theory]
    [InlineData("Owner", true)]
    [InlineData("Attendant", true)]
    [InlineData("Professional", false)]
    [InlineData(null, false)]
    public void The_whole_agenda_belongs_to_owner_and_attendant_only(string? role, bool expected) =>
        Assert.Equal(expected, new Actor(role, inBusiness: role is not null).OperatesWholeAgenda());

    [Theory]
    [InlineData("Attendant")]
    [InlineData("Professional")]
    public void Only_the_owner_passes_the_owner_check(string role) =>
        Assert.Equal("auth.forbidden", Assert.Throws<DomainException>(() => new Actor(role, inBusiness: true).RequireOwner()).Code);

    private static async Task<Exception?> CallAsync(Type type, MethodInfo method, IActorContext actor)
    {
        object instance = Build(type, actor);
        object?[] args = [.. method.GetParameters().Select(p => p.ParameterType.IsValueType ? Activator.CreateInstance(p.ParameterType) : null)];

        try
        {
            if (method.Invoke(instance, args) is Task task)
            {
                await task;
            }

            return null;
        }
        catch (TargetInvocationException e)
        {
            return e.InnerException;
        }
        catch (Exception e)
        {
            return e;
        }
    }

    /// <summary>Monta o caso de uso com o ator de teste, o carregador do dono e o relógio; o resto é nulo.</summary>
    private static object Build(Type type, IActorContext actor)
    {
        ConstructorInfo constructor = type.GetConstructors().Single();

        object?[] args = [.. constructor.GetParameters().Select(p => p.ParameterType switch
        {
            Type t when t == typeof(IActorContext) => actor,
            Type t when t == typeof(CurrentBusinessLoader) => new CurrentBusinessLoader(null!, actor),
            Type t when t == typeof(AgendaScope) => new AgendaScope(actor, null!, null!),
            Type t when t == typeof(AppointmentAccess) => new AppointmentAccess(null!, null!, null!, null!, actor, TimeProvider.System),
            Type t when t == typeof(TimeProvider) => TimeProvider.System,
            Type t when t.IsValueType => Activator.CreateInstance(t),
            _ => null,
        })];

        return constructor.Invoke(args);
    }

    private sealed class Actor(string? role, bool inBusiness) : IActorContext
    {
        public Guid? UserId { get; } = Guid.NewGuid();

        public Guid? BusinessId { get; } = inBusiness ? Guid.NewGuid() : null;

        public string? BusinessRole => role;

        public bool IsPlatformAdmin => false;
    }
}
