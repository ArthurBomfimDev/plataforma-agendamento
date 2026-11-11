using System.Net;
using System.Text.Json;
using Booking.Arguments.Module.Availability;
using Booking.Arguments.Module.Scheduling;
using Booking.Domain.DomainService.Module.Availability;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Scheduling;

/// <summary>
/// 11/11: o consumidor e o balcão recebiam "esse horário acabou de ser ocupado" com o horário livre. A causa era dupla:
/// (1) a lista de horários e a gravação usam o mesmo calculador, mas qualquer horário fora dela (almoço, antecedência
/// mínima, grade) saía com o mesmo 409 das disputas; (2) o balcão aceita qualquer hora digitada. Estes testes travam
/// a regra: o que o calculador oferece é aceito, e cada recusa diz o motivo verdadeiro.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class SlotConsistencyTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    /// <summary>Jornada 09–13 e 14:30–19 no dia de teste, como a quarta-feira do caso real; serviço de 45 min, passo de 15.</summary>
    private async Task<TestBusiness> NewBusinessWithLunchBreakAsync(int bufferBefore, int bufferAfter)
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(45, bufferBefore, bufferAfter)]);
        Guid professional = business.ProfessionalIds[0];
        DayOfWeek day = TestCalendar.BookableDay.DayOfWeek;

        PagedResult<WorkScheduleResponse> existing = await _world.SendOkAsync<PagedResult<WorkScheduleResponse>>(
            HttpMethod.Get, $"/api/businesses/current/work-schedules?professionalId={professional}", null, business.OwnerToken);

        foreach (WorkScheduleResponse schedule in existing.Items.Where(s => s.DayOfWeek == day))
        {
            using HttpResponseMessage removed = await _world.SendAsync(HttpMethod.Delete, $"/api/businesses/current/work-schedules/{schedule.Id}", null, business.OwnerToken);
            Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);
        }

        DateOnly from = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-1);
        foreach ((TimeOnly start, TimeOnly end) in new[] { (new TimeOnly(9, 0), new TimeOnly(13, 0)), (new TimeOnly(14, 30), new TimeOnly(19, 0)) })
        {
            await _world.SendOkAsync(HttpMethod.Post, "/api/businesses/current/work-schedules",
                new AddWorkScheduleRequest(professional, day, start, end, from, null), business.OwnerToken);
        }

        return business;
    }

    private Task<AvailableSlotsResponse> SlotsAsync(TestBusiness business) =>
        _world.SendOkAsync<AvailableSlotsResponse>(
            HttpMethod.Get,
            $"/api/businesses/{business.Id}/availability?serviceId={business.Services[0].Id}&professionalId={business.ProfessionalIds[0]}&date={TestCalendar.BookableDay:yyyy-MM-dd}",
            null, business.OwnerToken);

    private Task<HttpResponseMessage> CounterAsync(TestBusiness business, DateTimeOffset startsAt) =>
        _world.SendAsync(HttpMethod.Post, "/api/businesses/current/appointments/counter",
            new CounterAppointmentRequest(business.Services[0].Id, business.ProfessionalIds[0], startsAt, "Cliente do Balcão", null, null),
            business.OwnerToken);

    [Theory]
    [InlineData(0, 0)]
    [InlineData(10, 10)]
    [InlineData(0, 15)]
    [InlineData(15, 0)]
    public async Task Every_slot_the_calculator_offers_accepts_an_online_booking_and_a_counter_booking(int bufferBefore, int bufferAfter)
    {
        TestBusiness business = await NewBusinessWithLunchBreakAsync(bufferBefore, bufferAfter);
        TestService service = business.Services[0];
        Guid professional = business.ProfessionalIds[0];

        // Agenda de partida com um agendamento no meio, para haver horário colado nele (com e sem buffer).
        using (HttpResponseMessage first = await CounterAsync(business, TestCalendar.At(10, 0)))
        {
            Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        }

        int accepted = 0;

        // Agenda sem concorrência: a cada passo, o primeiro, o último e o do meio da lista do momento, até a agenda encher.
        for (int round = 0; round < 9; round++)
        {
            AvailableSlotsResponse offered = await SlotsAsync(business);

            if (offered.Slots.Count == 0)
            {
                break;
            }

            DateTimeOffset pick = (round % 3) switch
            {
                0 => offered.Slots[0],
                1 => offered.Slots[^1],
                _ => offered.Slots[offered.Slots.Count / 2],
            };

            if (round % 2 == 0)
            {
                TestUser customer = await _world.NewCustomerAsync();
                using HttpResponseMessage online = await _world.Client.SendAsync(_world.RequestAppointment(customer, business, service, professional, pick));
                await TestWorld.EnsureStatusAsync(online, HttpStatusCode.Created);
            }
            else
            {
                using HttpResponseMessage counter = await CounterAsync(business, pick);
                await TestWorld.EnsureStatusAsync(counter, HttpStatusCode.Created);
            }

            accepted++;
        }

        Assert.True(accepted >= 3, $"só {accepted} horários oferecidos foram aceitos antes de a agenda encher");
    }

    [Fact]
    public async Task Lunch_break_is_outside_work_hours_not_a_taken_slot_online_and_at_the_counter()
    {
        TestBusiness business = await NewBusinessWithLunchBreakAsync(0, 0);
        DateTimeOffset lunch = TestCalendar.At(13, 0);

        using HttpResponseMessage counter = await CounterAsync(business, lunch);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, counter.StatusCode);
        Assert.Equal("appointment.outside_work_hours", await TestWorld.ErrorCodeAsync(counter));

        TestUser customer = await _world.NewCustomerAsync();
        using HttpResponseMessage online = await _world.Client.SendAsync(
            _world.RequestAppointment(customer, business, business.Services[0], business.ProfessionalIds[0], lunch));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, online.StatusCode);
        Assert.Equal("appointment.outside_work_hours", await TestWorld.ErrorCodeAsync(online));
    }

    [Fact]
    public async Task Really_taken_slot_stays_a_409_with_alternatives()
    {
        TestBusiness business = await NewBusinessWithLunchBreakAsync(0, 0);

        using (HttpResponseMessage first = await CounterAsync(business, TestCalendar.At(12, 0)))
        {
            Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        }

        // 11:30, 11:45 e 12:15 invadem as 12:00–12:45 e cabem na jornada (até 13:00). As 11:15 terminam às 12:00 e cabem.
        foreach (DateTimeOffset taken in new[] { TestCalendar.At(11, 30), TestCalendar.At(11, 45), TestCalendar.At(12, 0), TestCalendar.At(12, 15) })
        {
            using HttpResponseMessage response = await CounterAsync(business, taken);
            Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
            string body = await response.Content.ReadAsStringAsync();
            using JsonDocument json = JsonDocument.Parse(body);
            Assert.Equal("appointment.slot_no_longer_available", json.RootElement.GetProperty("code").GetString());
            Assert.True(json.RootElement.GetProperty("alternatives").GetArrayLength() > 0);
        }

        using HttpResponseMessage adjacent = await CounterAsync(business, TestCalendar.At(11, 15));
        Assert.Equal(HttpStatusCode.Created, adjacent.StatusCode);
    }

    [Fact]
    public async Task Date_beyond_the_horizon_is_reported_as_such()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(45)]);
        DateOnly far = TestCalendar.BookableDay.AddDays(90);

        while (far.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday || BrazilianHolidays.IsHoliday(far))
        {
            far = far.AddDays(1);
        }

        TimeZoneInfo zone = TimeZoneInfo.FindSystemTimeZoneById(TestWorld.TimeZone);
        DateTime local = far.ToDateTime(new TimeOnly(10, 0));
        DateTimeOffset startsAt = new DateTimeOffset(local, zone.GetUtcOffset(local)).ToUniversalTime();

        TestUser customer = await _world.NewCustomerAsync();
        using HttpResponseMessage response = await _world.Client.SendAsync(
            _world.RequestAppointment(customer, business, business.Services[0], business.ProfessionalIds[0], startsAt));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("appointment.beyond_booking_horizon", await TestWorld.ErrorCodeAsync(response));
    }

    [Fact]
    public async Task Time_off_the_step_grid_is_reported_as_such_at_the_counter()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(45)]);

        using HttpResponseMessage response = await CounterAsync(business, TestCalendar.At(10, 7));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Equal("appointment.slot_not_on_grid", await TestWorld.ErrorCodeAsync(response));
    }
}
