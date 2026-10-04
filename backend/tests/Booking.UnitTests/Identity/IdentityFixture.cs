using Booking.Application.Common.Persistence;
using Booking.Application.Contracts.Identity;
using Booking.Application.Module.Identity.Commands;
using Booking.Domain.Entity.Module.Identity;
using Booking.Domain.Enum.Module.Identity;
using Booking.Domain.Interface.Repository.Module.Identity;
using Booking.Domain.ValueObject;
using Booking.Infrastructure.Module.Identity.Security;
using Microsoft.Extensions.Options;

namespace Booking.UnitTests.Identity;

/// <summary>Monta os casos de uso com repositórios em memória e as implementações reais de hash, token e JWT.</summary>
public sealed class IdentityFixture
{
    public const string Password = "senha-correta-123";

    public MutableClock Clock { get; } = new(new DateTimeOffset(2026, 10, 1, 12, 0, 0, TimeSpan.Zero));
    public InMemoryUsers Users { get; } = new();
    public InMemoryRefreshTokens RefreshTokens { get; } = new();
    public InMemoryUserTokens UserTokens { get; } = new();
    public RecordingMailer Mailer { get; } = new();
    public IPasswordHasher Hasher { get; } = new Argon2PasswordHasher();
    public ISecureTokenGenerator Tokens { get; } = new SecureTokenGenerator();
    public IdentityPolicy Policy { get; } = new();
    public IAccessTokenIssuer AccessTokens { get; }

    private readonly NoopUnitOfWork _unitOfWork = new();

    public IdentityFixture()
    {
        AccessTokens = new JwtAccessTokenIssuer(Options.Create(JwtSettings));
    }

    public static JwtOptions JwtSettings { get; } = new()
    {
        SigningKey = "chave-de-teste-com-mais-de-32-bytes-0123456789",
    };

    public RegisterUserCommand Register() =>
        new(Users, UserTokens, Hasher, Tokens, Mailer, _unitOfWork, Clock, Policy);

    public LoginCommand Login() => new(Users, Hasher, Sessions(), _unitOfWork, Clock);

    public RefreshSessionCommand Refresh() =>
        new(RefreshTokens, Users, Tokens, AccessTokens, _unitOfWork, Clock, Policy);

    public LogoutCommand Logout() => new(RefreshTokens, Tokens, _unitOfWork, Clock);

    public ConfirmEmailCommand ConfirmEmail() => new(UserTokens, Users, Tokens, _unitOfWork, Clock);

    public ForgotPasswordCommand ForgotPassword() =>
        new(Users, UserTokens, Tokens, Mailer, _unitOfWork, Clock, Policy);

    public ResetPasswordCommand ResetPassword() =>
        new(UserTokens, Users, RefreshTokens, Hasher, Tokens, _unitOfWork, Clock);

    private SessionIssuer Sessions() => new(AccessTokens, Tokens, RefreshTokens, Policy);

    public User SeedUser(string email = "ana@exemplo.com", UserStatus status = UserStatus.Active)
    {
        User user = User.Create(Email.Of(email), Hasher.Hash(Password), "Ana Souza");

        if (status == UserStatus.Suspended)
        {
            user.Suspend();
        }

        Users.Add(user);
        return user;
    }
}

public sealed class MutableClock(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;

    public override DateTimeOffset GetUtcNow() => Now;
}

public sealed class NoopUnitOfWork : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken ct = default) => Task.FromResult(0);
}

public sealed class InMemoryUsers : IUserRepository
{
    public List<User> Items { get; } = [];

    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        Task.FromResult(Items.FirstOrDefault(x => x.Id == id));

    public Task<User?> GetByEmailAsync(Email email, CancellationToken ct = default) =>
        Task.FromResult(Items.FirstOrDefault(x => x.Email == email));

    public Task<bool> ExistsByEmailAsync(Email email, CancellationToken ct = default) =>
        Task.FromResult(Items.Any(x => x.Email == email));

    public void Add(User user) => Items.Add(user);
}

public sealed class InMemoryRefreshTokens : IRefreshTokenRepository
{
    public List<RefreshToken> Items { get; } = [];

    public Task<RefreshToken?> GetByHashAsync(string tokenHash, CancellationToken ct = default) =>
        Task.FromResult(Items.FirstOrDefault(x => x.TokenHash == tokenHash));

    public void Add(RefreshToken token) => Items.Add(token);

    public Task RevokeAllActiveAsync(Guid userId, DateTimeOffset now, CancellationToken ct = default)
    {
        foreach (RefreshToken token in Items.Where(x => x.UserId == userId && x.IsActive(now)))
        {
            token.Revoke(now);
        }

        return Task.CompletedTask;
    }
}

public sealed class InMemoryUserTokens : IUserTokenRepository
{
    public List<UserToken> Items { get; } = [];

    public Task<UserToken?> GetByHashAsync(UserTokenType type, string tokenHash, CancellationToken ct = default) =>
        Task.FromResult(Items.FirstOrDefault(x => x.Type == type && x.TokenHash == tokenHash));

    public void Add(UserToken token) => Items.Add(token);

    public Task InvalidatePendingAsync(Guid userId, UserTokenType type, DateTimeOffset now, CancellationToken ct = default)
    {
        foreach (UserToken token in Items.Where(x => x.UserId == userId && x.Type == type && x.IsValid(now)))
        {
            token.MarkAsUsed(now);
        }

        return Task.CompletedTask;
    }
}

public sealed class RecordingMailer : IIdentityMailer
{
    public List<(string Email, string Token)> Confirmations { get; } = [];
    public List<(string Email, string Token)> Resets { get; } = [];

    public Task SendEmailConfirmationAsync(string email, string rawToken, CancellationToken ct = default)
    {
        Confirmations.Add((email, rawToken));
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string email, string rawToken, CancellationToken ct = default)
    {
        Resets.Add((email, rawToken));
        return Task.CompletedTask;
    }
}
