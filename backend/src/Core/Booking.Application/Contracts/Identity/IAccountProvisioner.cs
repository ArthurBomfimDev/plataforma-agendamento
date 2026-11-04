namespace Booking.Application.Contracts.Identity;

/// <summary>Conta existente achada pelo e-mail. <c>IsActive</c>: falso para suspensa, inativa ou apagada.</summary>
public sealed record AccountInfo(Guid UserId, string Email, string FullName, bool IsActive);

/// <summary>
/// Superfície do Identity para o aceite de convite: achar a conta pelo e-mail e criar uma já confirmada (o convite
/// foi enviado para aquele e-mail e quem abriu o link o recebeu, então o endereço está provado). Não grava: o
/// chamador confirma tudo no mesmo <c>SaveChanges</c>.
/// </summary>
public interface IAccountProvisioner
{
    Task<AccountInfo?> FindByEmailAsync(string email, CancellationToken ct = default);

    /// <summary>Cria a conta com a senha informada (regras de tamanho do Identity) e o e-mail já confirmado.</summary>
    Task<Guid> CreateConfirmedAccountAsync(string email, string fullName, string password, CancellationToken ct = default);
}
