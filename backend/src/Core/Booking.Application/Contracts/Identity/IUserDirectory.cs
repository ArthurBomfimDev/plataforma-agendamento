namespace Booking.Application.Contracts.Identity;

/// <summary>Para onde mandar um aviso a uma conta ativa: o e-mail e o nome do cadastro.</summary>
public sealed record UserContact(Guid UserId, string Email, string FullName);

/// <summary>Superfície pública do Identity para exibir quem é a pessoa por trás de uma conta.</summary>
public interface IUserDirectory
{
    /// <summary>Nome do cadastro de cada conta informada que existe.</summary>
    Task<IReadOnlyDictionary<Guid, string>> GetFullNamesAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default);

    /// <summary>Contato das contas informadas que existem e estão ativas. Conta suspensa ou apagada não recebe aviso.</summary>
    Task<IReadOnlyList<UserContact>> GetActiveContactsAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default);
}
