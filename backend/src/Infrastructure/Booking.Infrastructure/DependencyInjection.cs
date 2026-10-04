using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Identity;
using Booking.Application.Module.Identity.Commands;
using Booking.Application.Module.Identity.Queries;
using Booking.Domain.Interface.Repository.Module.Identity;
using Booking.Infrastructure.Module.Identity;
using Booking.Infrastructure.Module.Identity.Repository;
using Booking.Infrastructure.Module.Identity.Security;
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
        services.AddScoped<GetCurrentUserQuery>();
    }
}
