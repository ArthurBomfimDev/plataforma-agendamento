using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Availability;
using Booking.Application.Contracts.Catalog;
using Booking.Application.Contracts.Compliance;
using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.Notifications;
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
using Booking.Application.Module.Notifications.Commands;
using Booking.Application.Module.Notifications.Email;
using Booking.Application.Module.Notifications.Integration;
using Booking.Application.Module.People.Commands;
using Booking.Application.Module.People.Queries;
using Booking.Application.Module.Scheduling.Commands;
using Booking.Application.Module.Scheduling.Integration;
using Booking.Application.Module.Scheduling.Queries;
using Booking.Application.Module.Tenancy.Commands;
using Booking.Application.Module.Tenancy.Geo;
using Booking.Application.Module.Tenancy.Queries;
using Booking.Domain.Interface.Repository.Module.Availability;
using Booking.Domain.Interface.Repository.Module.Catalog;
using Booking.Domain.Interface.Repository.Module.Compliance;
using Booking.Domain.Interface.Repository.Module.Identity;
using Booking.Domain.Interface.Repository.Module.Notifications;
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
using Booking.Infrastructure.Module.Notifications;
using Booking.Infrastructure.Module.Notifications.Repository;
using Booking.Infrastructure.Module.People;
using Booking.Infrastructure.Module.People.Repository;
using Booking.Infrastructure.Module.Scheduling;
using Booking.Infrastructure.Module.Scheduling.Repository;
using Booking.Infrastructure.Module.Tenancy;
using Booking.Infrastructure.Module.Tenancy.Geo;
using Booking.Infrastructure.Module.Tenancy.Repository;
using Booking.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Booking.Infrastructure;

public static class DependencyInjection
{
    /// <param name="isDevelopment">
    /// Só o que muda por ambiente dentro da infraestrutura: em Development, sem SMTP configurado, o e-mail vai para o
    /// Mailpit local. Fora dele, sem SMTP a API não sobe (ADR-021). O padrão é o lado exigente.
    /// </param>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration, bool isDevelopment = false)
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
        services.AddNotificationsModule(configuration, isDevelopment);
        services.AddGeo(configuration);

        return services;
    }

    /// <summary>
    /// Geocodificação e CEP (ADR-016, ADR-022), no módulo Tenancy. Cada provedor tem um <c>HttpClient</c> próprio, sem
    /// os loggers padrão: eles escreveriam a URL, e a URL leva o texto ou o ponto consultado.
    /// </summary>
    private static void AddGeo(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<GeoOptions>()
            .Bind(configuration.GetSection(GeoOptions.SectionName))
            .Validate(o => !string.IsNullOrWhiteSpace(o.UserAgent), "Geo:UserAgent é obrigatório (política do Nominatim).")
            .Validate(o => o.TimeoutSeconds is >= 1 and <= 30, "Geo:TimeoutSeconds deve ficar entre 1 e 30.")
            .Validate(o => Uri.TryCreate(o.Nominatim.BaseUrl, UriKind.Absolute, out _), "Geo:Nominatim:BaseUrl precisa ser uma URL absoluta.")
            .Validate(
                o => o.PostalCode.Provider is PostalCodeOptions.BrasilApi or PostalCodeOptions.ViaCep,
                "Geo:PostalCode:Provider deve ser BrasilApi ou ViaCep.")
            .Validate(o => Uri.TryCreate(o.PostalCode.ResolvedBaseUrl, UriKind.Absolute, out _), "Geo:PostalCode:BaseUrl precisa ser uma URL absoluta.")
            .ValidateOnStart();

        services.AddSingleton<GeoCache>();
        services.AddSingleton<NominatimThrottle>();

        void Configure(IServiceProvider sp, HttpClient client, Func<GeoOptions, string> baseUrl)
        {
            GeoOptions options = sp.GetRequiredService<IOptions<GeoOptions>>().Value;
            client.BaseAddress = new Uri(EnsureTrailingSlash(baseUrl(options)));
            client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
            client.DefaultRequestHeaders.UserAgent.ParseAdd(options.UserAgent);
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
        }

        services.AddHttpClient<NominatimGeocodingProvider>((sp, client) => Configure(sp, client, o => o.Nominatim.BaseUrl))
            .RemoveAllLoggers();
        services.AddHttpClient<BrasilApiPostalCodeLookup>((sp, client) => Configure(sp, client, o => o.PostalCode.ResolvedBaseUrl))
            .RemoveAllLoggers();
        services.AddHttpClient<ViaCepPostalCodeLookup>((sp, client) => Configure(sp, client, o => o.PostalCode.ResolvedBaseUrl))
            .RemoveAllLoggers();

        services.AddScoped<IGeocodingProvider>(sp => new CachingGeocodingProvider(
            sp.GetRequiredService<NominatimGeocodingProvider>(), sp.GetRequiredService<GeoCache>()));
        services.AddScoped<IPostalCodeLookup>(sp =>
        {
            IPostalCodeLookup inner = sp.GetRequiredService<IOptions<GeoOptions>>().Value.PostalCode.Provider == PostalCodeOptions.ViaCep
                ? sp.GetRequiredService<ViaCepPostalCodeLookup>()
                : sp.GetRequiredService<BrasilApiPostalCodeLookup>();
            return new CachingPostalCodeLookup(inner, sp.GetRequiredService<GeoCache>());
        });

        services.AddScoped<LookupPostalCodeQuery>();
        services.AddScoped<SearchPlacesQuery>();
        services.AddScoped<ReverseGeocodeQuery>();
    }

    private static string EnsureTrailingSlash(string url) => url.EndsWith('/') ? url : url + "/";

    private static void AddIdentityModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(
                o => System.Text.Encoding.UTF8.GetByteCount(o.SigningKey) >= JwtOptions.MinSigningKeyBytes,
                $"Jwt:SigningKey precisa ter ao menos {JwtOptions.MinSigningKeyBytes} bytes.")
            .Validate(o => o.AccessTokenMinutes is > 0 and <= 60, "Jwt:AccessTokenMinutes deve ficar entre 1 e 60.")
            .ValidateOnStart();

        services.AddSingleton(new IdentityPolicy
        {
            RequireEmailConfirmation = configuration.GetValue("Identity:RequireEmailConfirmation", defaultValue: true),
        });
        services.AddSingleton<IPasswordHasher, Argon2PasswordHasher>();
        services.AddSingleton<ISecureTokenGenerator, SecureTokenGenerator>();
        services.AddSingleton<IAccessTokenIssuer, JwtAccessTokenIssuer>();
        services.AddScoped<IUserDirectory, UserDirectory>();

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IUserTokenRepository, UserTokenRepository>();

        services.AddScoped<SessionIssuer>();
        services.AddScoped<RegisterUserCommand>();
        services.AddScoped<LoginCommand>();
        services.AddScoped<RefreshSessionCommand>();
        services.AddScoped<LogoutCommand>();
        services.AddScoped<ConfirmEmailCommand>();
        services.AddScoped<ResendConfirmationCommand>();
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
        services.AddScoped<CustomerNameResolver>();
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

    /// <summary>
    /// E-mail por outbox (ADR-021). Sem SMTP configurado, a API não sobe fora de Development: nunca cai em silêncio para
    /// "só log" em produção. Em Development, o padrão é o Mailpit local (SMTP na 1025, sem TLS).
    /// </summary>
    private static void AddNotificationsModule(this IServiceCollection services, IConfiguration configuration, bool isDevelopment)
    {
        services.AddOptions<EmailOptions>()
            .Bind(configuration.GetSection(EmailOptions.SectionName))
            .PostConfigure(o =>
            {
                if (isDevelopment)
                {
                    o.Smtp.Host ??= "localhost";
                    o.From ??= "nao-responda@example.com";
                    o.Smtp.Port = o.Smtp.Port == 0 ? 1025 : o.Smtp.Port;
                }
                else
                {
                    o.Smtp.Port = o.Smtp.Port == 0 ? 587 : o.Smtp.Port;
                }
            })
            .Validate(o => !string.IsNullOrWhiteSpace(o.Smtp.Host), "Email:Smtp:Host não configurado: sem SMTP a API não sobe fora de Development.")
            .Validate(o => !string.IsNullOrWhiteSpace(o.From) && o.From.Contains('@'), "Email:From não configurado ou inválido.")
            .ValidateOnStart();

        services.AddOptions<AppOptions>()
            .Bind(configuration.GetSection(AppOptions.SectionName))
            .PostConfigure(o =>
            {
                if (isDevelopment)
                {
                    o.PublicBaseUrl ??= "http://localhost:8080";
                }

                o.BrandName = string.IsNullOrWhiteSpace(o.BrandName) ? AppOptions.DefaultBrandName : o.BrandName.Trim();
            })
            .Validate(
                o => Uri.TryCreate(o.PublicBaseUrl, UriKind.Absolute, out Uri? uri) && uri.Scheme is "http" or "https",
                "App:PublicBaseUrl não configurado: os links dos e-mails precisam do endereço público do frontend.")
            .ValidateOnStart();

        services.AddSingleton(sp =>
        {
            AppOptions app = sp.GetRequiredService<IOptions<AppOptions>>().Value;
            return new NotificationSettings(app.BrandName, app.PublicBaseUrl!);
        });

        services.AddSingleton<IEmailSender, SmtpEmailSender>();
        services.AddScoped<IOutboxRepository, OutboxRepository>();
        services.AddScoped<IEmailOutbox, EmailOutbox>();
        services.AddScoped<IIdentityMailer, IdentityMailer>();
        services.AddScoped<IAppointmentNotifier, AppointmentNotifier>();
        services.AddScoped<DispatchOutboxCommand>();
    }
}
