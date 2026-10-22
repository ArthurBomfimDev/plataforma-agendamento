using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Availability;
using Booking.Application.Contracts.Catalog;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Availability.Converter;
using Booking.Arguments.Module.Availability;
using Booking.Domain.DomainService.Module.Availability;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Availability;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Availability;

namespace Booking.Application.Module.Availability.Queries;

public sealed class ListWorkSchedulesQuery(IWorkScheduleRepository schedules, IActorContext actor)
{
    public async Task<PagedResult<WorkScheduleResponse>> ExecuteAsync(Guid professionalId, PageRequest page, CancellationToken ct = default)
    {
        actor.RequireBusinessId();

        PagedResult<WorkSchedule> result = await schedules.ListForProfessionalAsync(professionalId, page, ct);
        return new PagedResult<WorkScheduleResponse>([.. result.Items.Select(AvailabilityConverter.ToResponse)], result.Page, result.PageSize, result.TotalCount);
    }
}

public sealed class ListScheduleExceptionsQuery(IScheduleExceptionRepository exceptions, IActorContext actor, TimeProvider clock)
{
    public async Task<PagedResult<ScheduleExceptionResponse>> ExecuteAsync(PageRequest page, CancellationToken ct = default)
    {
        actor.RequireBusinessId();

        PagedResult<ScheduleException> result = await exceptions.ListUpcomingAsync(clock.GetUtcNow(), page, ct);
        return new PagedResult<ScheduleExceptionResponse>([.. result.Items.Select(AvailabilityConverter.ToResponse)], result.Page, result.PageSize, result.TotalCount);
    }
}

/// <summary>Horários livres de um profissional para um serviço num dia. Público: é o que a vitrine mostra.</summary>
public sealed class GetAvailableSlotsQuery(IServiceCatalog catalog, IBusinessDirectory businesses, IAvailabilityService availability)
{
    public async Task<AvailableSlotsResponse> ExecuteAsync(
        Guid businessId, Guid serviceId, Guid professionalId, DateOnly date, CancellationToken ct = default)
    {
        BusinessSchedulingInfo business = await businesses.GetSchedulingInfoAsync(businessId, ct) ?? throw new DomainException("business.not_found");

        if (!business.IsBookable)
        {
            throw new DomainException("business.not_found");
        }

        BookableService service = await catalog.GetBookableAsync(businessId, serviceId, professionalId, ct)
            ?? throw new DomainException("service.not_found");

        IReadOnlyList<DateTimeOffset> slots = await availability.GetSlotStartsAsync(
            new SlotQuery(businessId, professionalId, date, service.DurationMinutes, service.BufferBeforeMinutes, service.BufferAfterMinutes, service.SlotStepMinutes),
            ct);

        return new AvailableSlotsResponse(professionalId, serviceId, date, business.TimeZone, BrazilianHolidays.NameOf(date), slots);
    }
}
