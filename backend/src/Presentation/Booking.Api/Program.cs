using System.Threading.RateLimiting;
using Booking.Api.Common;
using Booking.Application.Common.Tenancy;
using Booking.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.Options;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<DomainExceptionHandler>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantContext, HttpTenantContext>();
builder.Services.AddScoped<IActorContext, HttpActorContext>();
builder.Services.AddHostedService<PendingExpirationWorker>();
builder.Services.AddHostedService<OutboxWorker>();
builder.Services.AddInfrastructure(builder.Configuration, isDevelopment: builder.Environment.IsDevelopment());

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddSingleton<IConfigureOptions<JwtBearerOptions>, ConfigureJwtBearer>();
builder.Services.AddAuthorizationBuilder().AddBookingPolicies();

// Freio de força bruta nas rotas de autenticação: 10 requisições por minuto por IP.
builder.Services.AddRateLimiter(limiter =>
{
    limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    limiter.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
});

// O frontend roda em outra origem (e, depois, o Capacitor e o Tauri também). Só as origens
// configuradas em Cors:AllowedOrigins são liberadas; sem configuração, nenhuma. Sem credenciais:
// a autenticação é por token no header, não por cookie (regra 3 de empacotamento).
string[] allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(cors => cors.AddDefaultPolicy(policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()));

builder.Services.AddHealthChecks();

WebApplication app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseSecurityHeaders();

// HSTS só fora de Development: em produção a API fica atrás de TLS; no ambiente local, HTTP puro.
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

/// <summary>
/// Exposto para os testes de integração (WebApplicationFactory) e de arquitetura.
/// </summary>
public partial class Program;
