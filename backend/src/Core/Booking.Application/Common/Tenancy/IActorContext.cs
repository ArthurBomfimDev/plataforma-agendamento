namespace Booking.Application.Common.Tenancy;

/// <summary>Quem está agindo: o usuário do token e, se houver, o estabelecimento e o papel ativos.</summary>
public interface IActorContext
{
    Guid? UserId { get; }

    Guid? BusinessId { get; }

    /// <summary><c>Owner</c> ou <c>Professional</c>; nulo quando o token não tem contexto de estabelecimento.</summary>
    string? BusinessRole { get; }

    /// <summary>Admin da plataforma (ADR-020), pela claim <see cref="PlatformClaims.Role"/> do token.</summary>
    bool IsPlatformAdmin { get; }
}
