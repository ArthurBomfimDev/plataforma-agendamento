namespace Booking.Application.Contracts.Identity;

/// <summary>Superfície pública do Identity para exibir quem é a pessoa por trás de uma conta.</summary>
public interface IUserDirectory
{
    /// <summary>Nome do cadastro de cada conta informada que existe.</summary>
    Task<IReadOnlyDictionary<Guid, string>> GetFullNamesAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default);
}
