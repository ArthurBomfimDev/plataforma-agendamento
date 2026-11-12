using System.Net;
using Booking.Arguments.Module.Availability;
using Booking.IntegrationTests.Infrastructure;

namespace Booking.IntegrationTests.Availability;

/// <summary>Edição de jornada: a mesma invariante da criação (sem sobreposição) e o filtro de tenant.</summary>
[Collection(IntegrationCollection.Name)]
public sealed class WorkScheduleTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    // O TestWorld cria uma jornada por dia, de domingo a sábado: o índice 1 é a segunda-feira do primeiro profissional.
    private static Guid MondayOf(TestBusiness business) => business.WorkScheduleIds[(int)DayOfWeek.Monday];

    [Fact]
    public async Task F1_owner_edits_a_schedule_without_overlap()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        DateOnly from = DateOnly.FromDateTime(DateTime.UtcNow);

        WorkScheduleResponse edited = await _world.SendOkAsync<WorkScheduleResponse>(
            HttpMethod.Put, $"/api/businesses/current/work-schedules/{MondayOf(business)}",
            new UpdateWorkScheduleRequest(DayOfWeek.Monday, new TimeOnly(8, 0), new TimeOnly(12, 0), from, null), business.OwnerToken);

        Assert.Equal(new TimeOnly(8, 0), edited.StartTime);
        Assert.Equal(new TimeOnly(12, 0), edited.EndTime);
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM availability.work_schedule WHERE id = @id AND start_time = '08:00' AND end_time = '12:00'",
            ("id", MondayOf(business))));
    }

    [Fact]
    public async Task F2_edit_that_overlaps_another_line_is_refused_and_nothing_changes()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        DateOnly from = DateOnly.FromDateTime(DateTime.UtcNow);
        string monday = $"/api/businesses/current/work-schedules/{MondayOf(business)}";

        // Segunda com pausa: 08:00–12:00 e 13:00–18:00.
        await _world.SendOkAsync(HttpMethod.Put, monday,
            new UpdateWorkScheduleRequest(DayOfWeek.Monday, new TimeOnly(8, 0), new TimeOnly(12, 0), from, null), business.OwnerToken);
        await _world.SendOkAsync(HttpMethod.Post, "/api/businesses/current/work-schedules",
            new AddWorkScheduleRequest(business.ProfessionalIds[0], DayOfWeek.Monday, new TimeOnly(13, 0), new TimeOnly(18, 0), from, null), business.OwnerToken);

        // Esticar a manhã até 14:00 cruza a tarde.
        using HttpResponseMessage response = await _world.SendAsync(HttpMethod.Put, monday,
            new UpdateWorkScheduleRequest(DayOfWeek.Monday, new TimeOnly(8, 0), new TimeOnly(14, 0), from, null), business.OwnerToken);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("work_schedule.overlaps", await TestWorld.ErrorCodeAsync(response));
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM availability.work_schedule WHERE id = @id AND end_time = '12:00'", ("id", MondayOf(business))));
    }

    [Fact]
    public async Task F4_a_shift_can_close_at_midnight_and_the_last_hour_is_bookable()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        DateOnly monday = NextMonday();

        WorkScheduleResponse edited = await _world.SendOkAsync<WorkScheduleResponse>(
            HttpMethod.Put, $"/api/businesses/current/work-schedules/{MondayOf(business)}",
            new UpdateWorkScheduleRequest(DayOfWeek.Monday, new TimeOnly(18, 0), new TimeOnly(0, 0), DateOnly.FromDateTime(DateTime.UtcNow), null),
            business.OwnerToken);

        Assert.Equal(new TimeOnly(0, 0), edited.EndTime);
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM availability.work_schedule WHERE id = @id AND start_time = '18:00' AND end_time = '00:00'",
            ("id", MondayOf(business))));

        AvailableSlotsResponse day = await _world.SendOkAsync<AvailableSlotsResponse>(
            HttpMethod.Get,
            $"/api/businesses/{business.Id}/availability?serviceId={business.Services[0].Id}&professionalId={business.ProfessionalIds[0]}&date={monday:yyyy-MM-dd}",
            null, null!);

        TimeZoneInfo zone = TimeZoneInfo.FindSystemTimeZoneById(TestWorld.TimeZone);
        TimeOnly last = TimeOnly.FromDateTime(TimeZoneInfo.ConvertTime(day.Slots[^1], zone).DateTime);
        Assert.Equal(new TimeOnly(23, 0), last);
    }

    [Fact]
    public async Task F5_a_shift_from_00_00_to_00_00_is_refused()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);

        using HttpResponseMessage response = await _world.SendAsync(
            HttpMethod.Put, $"/api/businesses/current/work-schedules/{MondayOf(business)}",
            new UpdateWorkScheduleRequest(DayOfWeek.Monday, new TimeOnly(0, 0), new TimeOnly(0, 0), DateOnly.FromDateTime(DateTime.UtcNow), null),
            business.OwnerToken);

        Assert.True((int)response.StatusCode is >= 400 and < 500);
        Assert.Equal("work_schedule.end_before_start", await TestWorld.ErrorCodeAsync(response));
    }

    private static DateOnly NextMonday()
    {
        DateOnly day = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(3);
        while (day.DayOfWeek != DayOfWeek.Monday)
        {
            day = day.AddDays(1);
        }

        return day;
    }

    [Fact]
    public async Task F3_owner_cannot_edit_the_schedule_of_another_business()
    {
        TestBusiness a = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);
        TestBusiness b = await _world.NewBusinessAsync(1, [new ServiceSpec(60)]);

        using HttpResponseMessage response = await _world.SendAsync(
            HttpMethod.Put, $"/api/businesses/current/work-schedules/{MondayOf(b)}",
            new UpdateWorkScheduleRequest(DayOfWeek.Monday, new TimeOnly(8, 0), new TimeOnly(9, 0), DateOnly.FromDateTime(DateTime.UtcNow), null),
            a.OwnerToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("work_schedule.not_found", await TestWorld.ErrorCodeAsync(response));
        Assert.Equal(1, await _world.CountAsync(
            "SELECT count(*) FROM availability.work_schedule WHERE id = @id AND start_time = '06:00' AND end_time = '22:00'", ("id", MondayOf(b))));
    }
}
