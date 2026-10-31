using Booking.Domain.Entity.Base;
using Booking.Domain.Exceptions;

namespace Booking.Domain.Entity.Module.People;

/// <summary>
/// Perfil de consumo. Conta global, fora do tenant (ADR-004): a relação com cada estabelecimento é
/// derivada dos agendamentos. O CPF, opcional e cifrado, entra junto com o fluxo da vertical de saúde.
/// </summary>
public sealed class Customer : BaseEntity, IAuditable
{
    public const int MinimumAge = 18;

    public Guid UserId { get; private set; }
    public DateOnly BirthDate { get; private set; }
    public string? SocialName { get; private set; }

    private Customer()
    {
    }

    // 18 anos completos tiram do escopo o tratamento de dado de criança e adolescente (LGPD, Art. 14).
    // Menor é agendado pela conta de um adulto, com o nome de quem será atendido no próprio agendamento.
    public static Customer Create(Guid userId, DateOnly birthDate, string? socialName, DateOnly today)
    {
        if (AgeOn(birthDate, today) < MinimumAge)
        {
            throw new DomainException("customer.underage");
        }

        return new Customer
        {
            UserId = userId,
            BirthDate = birthDate,
            SocialName = string.IsNullOrWhiteSpace(socialName) ? null : socialName.Trim(),
        };
    }

    public void ChangeSocialName(string? socialName) =>
        SocialName = string.IsNullOrWhiteSpace(socialName) ? null : socialName.Trim();

    public static int AgeOn(DateOnly birthDate, DateOnly today)
    {
        int age = today.Year - birthDate.Year;
        return birthDate.AddYears(age) > today ? age - 1 : age;
    }
}
