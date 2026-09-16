namespace Booking.Application.Module.Scheduling.Converter;

/// <summary>
/// ✗ Decisão 6 — mapeador por reflexão no módulo com snapshot. É o lugar onde o preço atual
/// sobrescreve o preço congelado sem nenhum teste perceber.
/// </summary>
public sealed class AppointmentSnapshotMapper(AutoMapper.IMapper mapper)
{
    public AutoMapper.IMapper Mapper { get; } = mapper;
}
