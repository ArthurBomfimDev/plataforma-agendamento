using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.People;
using Booking.Domain.Entity.Module.Scheduling;

namespace Booking.Application.Module.Scheduling.Commands;

/// <summary>
/// Nome de quem marcou, para o estabelecimento do próprio agendamento (pendência T, 27/10): nome social quando
/// existir, senão o do cadastro; no balcão, o nome informado. Só o lado do estabelecimento usa isto — a leitura de
/// agendamento sensível continua registrada por <see cref="AppointmentAccess"/>.
/// </summary>
/// <remarks>Dois contratos, nenhuma tabela de outro módulo: o People sabe o nome social, o Identity sabe o do cadastro.</remarks>
public sealed class CustomerNameResolver(IPeopleDirectory people, IUserDirectory users)
{
    public async Task<IReadOnlyDictionary<Guid, string?>> ResolveAsync(IReadOnlyCollection<Appointment> appointments, CancellationToken ct)
    {
        List<Guid> customerIds = [.. appointments.Where(a => a.CustomerId is not null).Select(a => a.CustomerId!.Value).Distinct()];

        IReadOnlyList<CustomerIdentity> customers = await people.GetCustomersAsync(customerIds, ct);
        IReadOnlyDictionary<Guid, string> fullNames = await users.GetFullNamesAsync([.. customers.Select(c => c.UserId).Distinct()], ct);

        Dictionary<Guid, string?> byCustomer = customers.ToDictionary(
            c => c.CustomerId,
            c => c.SocialName ?? fullNames.GetValueOrDefault(c.UserId));

        return appointments.ToDictionary(
            a => a.Id,
            a => a.CustomerId is Guid customerId ? byCustomer.GetValueOrDefault(customerId) : a.WalkInName);
    }

    public async Task<string?> ResolveAsync(Appointment appointment, CancellationToken ct) =>
        (await ResolveAsync([appointment], ct))[appointment.Id];
}
