using Booking.Application.Contracts.Notifications;
using Booking.Application.Module.Scheduling.Commands;
using Booking.Domain.Entity.Module.Scheduling;
using Booking.Domain.Enum.Module.Scheduling;
using Booking.IntegrationTests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace Booking.IntegrationTests.Scheduling;

/// <summary>
/// Lembretes de 24 h e 1 h (C1), contra o banco real. Os agendamentos são gravados direto, com o horário relativo a agora,
/// porque a API só aceita horário dentro da jornada e os lembretes dependem do relógio. O worker de verdade está desligado
/// nos testes; o comando roda quando o teste quer.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class ReminderTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private static readonly SchedulingActor _customerActor = new(Guid.CreateVersion7(), "Customer");

    private async Task<(TestBusiness Business, TestUser Customer)> NewCustomerAndBusinessAsync() =>
        (await _world.NewBusinessAsync(1, [new ServiceSpec(30)]), await _world.NewCustomerAsync());

    private async Task<Guid> SaveAsync(TestBusiness business, TestUser customer, TimeSpan startsIn, bool autoConfirm = true)
    {
        var service = new ServiceSnapshot(business.Services[0].Id, "Serviço de teste", 30, 0, 0, 5000);
        DateTimeOffset now = DateTimeOffset.UtcNow;

        Appointment appointment = Appointment.Request(
            business.Id, business.ProfessionalIds[0], customer.CustomerId!.Value, service, now + startsIn,
            new BookingPolicy(autoConfirm, PendingExpirationHours: 12, MinLeadTimeHours: 0), false, _customerActor, now.AddDays(-2), null, null, null);

        await using var direct = new DirectDbContext(fixture.ConnectionString);
        direct.Db.Add(appointment);
        await direct.Db.SaveChangesAsync();
        return appointment.Id;
    }

    private async Task<int> RunAsync(BookingApiFactory? factory = null)
    {
        await using AsyncServiceScope scope = (factory ?? fixture.Factory).Services.CreateAsyncScope();
        return await scope.ServiceProvider.GetRequiredService<SendAppointmentRemindersCommand>().ExecuteAsync();
    }

    private Task<long> EmailsToAsync(TestUser customer) =>
        _world.CountAsync("SELECT count(*) FROM notifications.outbox WHERE payload::text LIKE @pattern", ("pattern", $"%{customer.Email}%"));

    private Task<long> FlagsAsync(Guid appointmentId, string column) =>
        _world.CountAsync($"SELECT count(*) FROM scheduling.appointment WHERE id = @id AND {column} IS NOT NULL", ("id", appointmentId));

    [Fact]
    public async Task R1_a_confirmed_appointment_in_the_last_day_gets_one_reminder_and_a_second_round_adds_nothing()
    {
        (TestBusiness business, TestUser customer) = await NewCustomerAndBusinessAsync();
        Guid id = await SaveAsync(business, customer, TimeSpan.FromHours(20));

        Assert.True(await RunAsync() >= 1);
        Assert.Equal(1, await EmailsToAsync(customer));
        Assert.Equal(1, await FlagsAsync(id, "day_before_reminder_sent_at"));
        Assert.Equal(0, await FlagsAsync(id, "hour_before_reminder_sent_at"));

        // O worker reiniciou, ou outra rodada veio: a marca está gravada junto com o e-mail, então nada se repete.
        await RunAsync();
        await RunAsync();
        Assert.Equal(1, await EmailsToAsync(customer));
    }

    [Fact]
    public async Task R2_inside_the_last_hour_only_the_hour_before_reminder_goes_out()
    {
        (TestBusiness business, TestUser customer) = await NewCustomerAndBusinessAsync();
        Guid id = await SaveAsync(business, customer, TimeSpan.FromMinutes(40));

        await RunAsync();

        Assert.Equal(1, await EmailsToAsync(customer));
        Assert.Equal(1, await FlagsAsync(id, "hour_before_reminder_sent_at"));
        Assert.Equal(0, await FlagsAsync(id, "day_before_reminder_sent_at"));
    }

    [Fact]
    public async Task R3_between_one_and_two_hours_and_beyond_a_day_nothing_goes_out()
    {
        (TestBusiness business, TestUser customer) = await NewCustomerAndBusinessAsync();
        await SaveAsync(business, customer, TimeSpan.FromMinutes(90));
        await SaveAsync(business, customer, TimeSpan.FromHours(30));

        await RunAsync();

        Assert.Equal(0, await EmailsToAsync(customer));
    }

    [Fact]
    public async Task R4_pending_cancelled_and_rejected_never_get_a_reminder()
    {
        (TestBusiness business, TestUser customer) = await NewCustomerAndBusinessAsync();

        // Pendente: ainda não foi confirmado.
        await SaveAsync(business, customer, TimeSpan.FromHours(20), autoConfirm: false);

        // Cancelado pelo estabelecimento depois de confirmado, e recusado: pela API real, nos dois estados que o banco guarda.
        AppointmentResponseLike cancelled = await BookThenAsync(business, customer, "cancel");
        AppointmentResponseLike rejected = await BookThenAsync(business, customer, "reject");

        await RunAsync();

        Assert.Equal(0, await EmailsToAsync(customer));
        Assert.Equal(0, await FlagsAsync(cancelled.Id, "day_before_reminder_sent_at"));
        Assert.Equal(0, await FlagsAsync(rejected.Id, "day_before_reminder_sent_at"));
    }

    private sealed record AppointmentResponseLike(Guid Id);

    /// <summary>Cria um agendamento para daqui a 20 h e o leva ao estado terminal pelo dono. Gravado e movido direto no domínio.</summary>
    private async Task<AppointmentResponseLike> BookThenAsync(TestBusiness business, TestUser customer, string how)
    {
        var service = new ServiceSnapshot(business.Services[0].Id, "Serviço de teste", 30, 0, 0, 5000);
        DateTimeOffset now = DateTimeOffset.UtcNow;
        bool cancel = how == "cancel";

        // Confirmado para cancelar; pendente para recusar (só o pendente se recusa).
        Appointment appointment = Appointment.Request(
            business.Id, business.ProfessionalIds[0], customer.CustomerId!.Value, service, now.AddHours(cancel ? 21 : 22),
            new BookingPolicy(AutoConfirm: cancel, PendingExpirationHours: 12, MinLeadTimeHours: 0), false, _customerActor, now.AddDays(-2), null, null, null);

        var owner = new SchedulingActor(business.OwnerUserId, "Owner");

        if (cancel)
        {
            appointment.CancelByBusiness(owner, now, "teste");
        }
        else
        {
            appointment.Reject(owner, now, "teste");
        }

        await using var direct = new DirectDbContext(fixture.ConnectionString);
        direct.Db.Add(appointment);
        await direct.Db.SaveChangesAsync();
        return new AppointmentResponseLike(appointment.Id);
    }

    [Fact]
    public async Task R5_a_counter_appointment_without_account_has_nobody_to_remind()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        var service = new ServiceSnapshot(business.Services[0].Id, "Serviço de teste", 30, 0, 0, 5000);
        DateTimeOffset now = DateTimeOffset.UtcNow;

        Appointment counter = Appointment.AtCounter(
            business.Id, business.ProfessionalIds[0], service, now.AddHours(20), false, "Cliente do balcão", null, null,
            new SchedulingActor(business.OwnerUserId, "Owner"), now);

        await using (var direct = new DirectDbContext(fixture.ConnectionString))
        {
            direct.Db.Add(counter);
            await direct.Db.SaveChangesAsync();
        }

        await RunAsync();

        Assert.Equal(0, await FlagsAsync(counter.Id, "day_before_reminder_sent_at"));
    }

    [Fact]
    public async Task R6_an_exhausted_budget_stops_the_reminders_but_never_a_confirmation_or_a_password_reset()
    {
        (TestBusiness business, TestUser customer) = await NewCustomerAndBusinessAsync();
        Guid id = await SaveAsync(business, customer, TimeSpan.FromHours(20));

        // Uma API com teto zero: nenhum lembrete cabe. É o caso do dia em que o provedor já está no limite.
        await using var capped = new BookingApiFactory(fixture.ConnectionString, settings: new Dictionary<string, string> { ["App:ReminderDailyEmailBudget"] = "0" });

        Assert.Equal(0, await RunAsync(capped));
        Assert.Equal(0, await EmailsToAsync(customer));
        // Sem marca: o lembrete não se perde, só espera a próxima rodada com orçamento.
        Assert.Equal(0, await FlagsAsync(id, "day_before_reminder_sent_at"));

        // Mesma API, mesmo orçamento esgotado: a confirmação do agendamento sai normalmente.
        await using (AsyncServiceScope scope = capped.Services.CreateAsyncScope())
        {
            var notifier = scope.ServiceProvider.GetRequiredService<IAppointmentNotifier>();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<Booking.Application.Common.Persistence.IUnitOfWork>();
            DateTimeOffset starts = DateTimeOffset.UtcNow.AddDays(3);

            await notifier.NotifyAsync(
                new AppointmentFacts(Guid.NewGuid(), business.Id, business.ProfessionalIds[0], customer.CustomerId, "Serviço de teste", starts, starts.AddMinutes(30), "Confirmed", false, null, null),
                AppointmentChange.Confirmed);
            await unitOfWork.SaveChangesAsync();
        }

        Assert.Equal(1, await EmailsToAsync(customer));

        // A mesma API com orçamento volta a mandar o lembrete quando o teto deixa (a que tem o teto padrão).
        Assert.True(await RunAsync() >= 1);
        Assert.Equal(1, await FlagsAsync(id, "day_before_reminder_sent_at"));
    }
}
