using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Availability;
using Booking.Application.Contracts.Catalog;
using Booking.Application.Contracts.Compliance;
using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Scheduling;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Availability.Commands;
using Booking.Application.Module.Availability.Integration;
using Booking.Application.Module.Availability.Queries;
using Booking.Application.Module.Catalog.Commands;
using Booking.Application.Module.Catalog.Queries;
using Booking.Application.Module.Compliance.Commands;
using Booking.Application.Module.Compliance.Integration;
using Booking.Application.Module.Compliance.Queries;
using Booking.Application.Module.Identity.Commands;
using Booking.Application.Module.Identity.Queries;
using Booking.Application.Module.People.Commands;
using Booking.Application.Module.People.Queries;
using Booking.Application.Module.Scheduling.Commands;
using Booking.Application.Module.Scheduling.Integration;
using Booking.Application.Module.Scheduling.Queries;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Application.Module.Tenancy.Queries;
using Booking.Domain.Interface.Repository.Module.Availability;
using Booking.Domain.Interface.Repository.Module.Catalog;
using Booking.Domain.Interface.Repository.Module.Compliance;
using Booking.Domain.Interface.Repository.Module.Identity;
using Booking.Domain.Interface.Repository.Module.People;
using Booking.Domain.Interface.Repository.Module.Scheduling;
using Booking.Domain.Interface.Repository.Module.Tenancy;
using Booking.Infrastructure.Module.Availability.Repository;
using Booking.Infrastructure.Module.Catalog;
using Booking.Infrastructure.Module.Catalog.Repository;
using Booking.Infrastructure.Module.Compliance.Repository;
using Booking.Infrastructure.Module.Identity;
using Booking.Infrastructure.Module.Identity.Repository;
using Booking.Infrastructure.Module.Identity.Security;
using Booking.Infrastructure.Module.People;
using Booking.Infrastructure.Module.People.Repository;
using Booking.Infrastructure.Module.Scheduling;
using Booking.Infrastructure.Module.Scheduling.Repository;
using Booking.Infrastructure.Module.Tenancy;
using Booking.Infrastructure.Module.Tenancy.Repository;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Booking.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        string connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException(
                "ConnectionStrings:Default não configurada. Use: dotnet user-secrets set \"ConnectionStrings:Default\" \"...\"");

        services.AddDbContext<BookingDbContext>(options => options
            .UseNpgsql(connectionString, o => o.UseNetTopologySuite())
            .UseSnakeCaseNamingConvention());

        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<BookingDbContext>());
        services.AddSingleton(TimeProvider.System);

        services.AddIdentityModule(configuration);
        services.AddTenancyModule();
        services.AddPeopleModule();
        services.AddCatalogModule();
        services.AddAvailabilityModule();
        services.AddSchedulingModule();
        services.AddComplianceModule();

        return services;
    }

    private static void AddIdentityModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(
                o => System.Text.Encoding.UTF8.GetByteCount(o.SigningKey) >= JwtOptions.MinSigningKeyBytes,
                $"Jwt:SigningKey precisa ter ao menos {JwtOptions.MinSigningKeyBytes} bytes.")
            .Validate(o => o.AccessTokenMinutes is > 0 and <= 60, "Jwt:AccessTokenMinutes deve ficar entre 1 e 60.")
            .ValidateOnStart();

        services.AddSingleton(new IdentityPolicy());
        services.AddSingleton<IPasswordHasher, Argon2PasswordHasher>();
        services.AddSingleton<ISecureTokenGenerator, SecureTokenGenerator>();
        services.AddSingleton<IAccessTokenIssuer, JwtAccessTokenIssuer>();
        services.AddSingleton<IIdentityMailer, LoggingIdentityMailer>();

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IUserTokenRepository, UserTokenRepository>();

        services.AddScoped<SessionIssuer>();
        services.AddScoped<RegisterUserCommand>();
        services.AddScoped<LoginCommand>();
        services.AddScoped<RefreshSessionCommand>();
        services.AddScoped<LogoutCommand>();
        services.AddScoped<ConfirmEmailCommand>();
        services.AddScoped<ForgotPasswordCommand>();
        services.AddScoped<ResetPasswordCommand>();
        services.AddScoped<SwitchContextCommand>();
        services.AddScoped<GetCurrentUserQuery>();
    }

    private static void AddTenancyModule(this IServiceCollection services)
    {
        services.AddScoped<IBusinessRepository, BusinessRepository>();
        services.AddScoped<IBusinessMembershipRepository, BusinessMembershipRepository>();
        services.AddScoped<IBusinessDirectory, BusinessDirectory>();

        services.AddScoped<CurrentBusinessLoader>();
        services.AddScoped<ActivationChecklist>();
        services.AddScoped<AdminBusinessCommands>();
        services.AddScoped<ListBusinessesForAdminQuery>();
        services.AddScoped<GetBusinessForAdminQuery>();
        services.AddScoped<RegisterBusinessCommand>();
        services.AddScoped<UpdateSchedulingPolicyCommand>();
        services.AddScoped<UpdateAddressCommand>();
        services.AddScoped<ConfirmLocationCommand>();
        services.AddScoped<SubmitBusinessCommand>();
        services.AddScoped<GetCurrentBusinessQuery>();
        services.AddScoped<GetPublicBusinessQuery>();
        services.AddScoped<SearchBusinessesQuery>();
    }

    private static void AddPeopleModule(this IServiceCollection services)
    {
        services.AddScoped<IProfessionalRepository, ProfessionalRepository>();
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<IPeopleDirectory, PeopleDirectory>();

        services.AddScoped<CreateProfessionalCommand>();
        services.AddScoped<UpdateProfessionalCommand>();
        services.AddScoped<SetPublicProfileConsentCommand>();
        services.AddScoped<RegisterCustomerCommand>();
        services.AddScoped<ListProfessionalsQuery>();
        services.AddScoped<ListPublicProfessionalsQuery>();
        services.AddScoped<GetMyCustomerProfileQuery>();
    }

    private static void AddCatalogModule(this IServiceCollection services)
    {
        services.AddScoped<IServiceRepository, ServiceRepository>();
        services.AddScoped<IServiceProfessionalRepository, ServiceProfessionalRepository>();
        services.AddScoped<IServiceCatalog, ServiceCatalog>();

        services.AddScoped<CreateServiceCommand>();
        services.AddScoped<UpdateServiceCommand>();
        services.AddScoped<EnableProfessionalCommand>();
        services.AddScoped<DisableProfessionalCommand>();
        services.AddScoped<ListServicesQuery>();
        services.AddScoped<ListPublicServicesQuery>();
    }

    private static void AddAvailabilityModule(this IServiceCollection services)
    {
        services.AddScoped<IWorkScheduleRepository, WorkScheduleRepository>();
        services.AddScoped<IScheduleExceptionRepository, ScheduleExceptionRepository>();
        services.AddScoped<IAvailabilityService, AvailabilityService>();

        services.AddScoped<AddWorkScheduleCommand>();
        services.AddScoped<UpdateWorkScheduleCommand>();
        services.AddScoped<RemoveWorkScheduleCommand>();
        services.AddScoped<AddScheduleExceptionCommand>();
        services.AddScoped<RemoveScheduleExceptionCommand>();
        services.AddScoped<ListWorkSchedulesQuery>();
        services.AddScoped<ListScheduleExceptionsQuery>();
        services.AddScoped<PreviewAffectedAppointmentsQuery>();
        services.AddScoped<GetAvailableSlotsQuery>();
        services.AddScoped<GetAvailabilityCalendarQuery>();
    }

    private static void AddSchedulingModule(this IServiceCollection services)
    {
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<IAgendaOccupancy, AgendaOccupancy>();
        services.AddScoped<IAffectedAppointments, AffectedAppointmentsService>();

        services.AddScoped<AppointmentAccess>();
        services.AddScoped<SlotGuard>();
        services.AddScoped<RequestAppointmentCommand>();
        services.AddScoped<CreateCounterAppointmentCommand>();
        services.AddScoped<ManageAppointmentCommand>();
        services.AddScoped<CancelMyAppointmentCommand>();
        services.AddScoped<ExpirePendingAppointmentsCommand>();
        services.AddScoped<GetAgendaQuery>();
        services.AddScoped<ListPendingAppointmentsQuery>();
        services.AddScoped<ListMyAppointmentsQuery>();
    }

    private static void AddComplianceModule(this IServiceCollection services)
    {
        services.AddScoped<IConsentRecordRepository, ConsentRecordRepository>();
        services.AddScoped<ISensitiveAccessLogRepository, SensitiveAccessLogRepository>();
        services.AddScoped<IComplianceGateway, ComplianceGateway>();

        services.AddScoped<GrantConsentCommand>();
        services.AddScoped<RevokeConsentCommand>();
        services.AddScoped<ListMyConsentsQuery>();
        services.AddSingleton<GetConsentVersionsQuery>();
    }
}
