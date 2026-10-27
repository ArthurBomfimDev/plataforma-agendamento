using System.Security.Cryptography;
using Booking.Domain.DomainService.Module.Availability;

namespace Booking.IntegrationTests.Infrastructure;

/// <summary>Data dos testes: dia útil futuro, sem feriado nacional, dentro do horizonte de 60 dias.</summary>
public static class TestCalendar
{
    private static readonly TimeZoneInfo _zone = TimeZoneInfo.FindSystemTimeZoneById(TestWorld.TimeZone);

    /// <summary>A partir de 3 dias à frente: folga de sobra para a antecedência mínima de 2 h.</summary>
    public static DateOnly BookableDay { get; } = FindBookableDay();

    /// <summary>Horário de parede em America/Sao_Paulo no <see cref="BookableDay"/>, como instante.</summary>
    public static DateTimeOffset At(int hour, int minute = 0)
    {
        DateTime local = BookableDay.ToDateTime(new TimeOnly(hour, minute));
        return new DateTimeOffset(local, _zone.GetUtcOffset(local)).ToUniversalTime();
    }

    private static DateOnly FindBookableDay()
    {
        DateOnly today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, _zone).DateTime);

        for (int offset = 3; offset < 60; offset++)
        {
            DateOnly day = today.AddDays(offset);

            if (day.DayOfWeek is not (DayOfWeek.Saturday or DayOfWeek.Sunday) && !BrazilianHolidays.IsHoliday(day))
            {
                return day;
            }
        }

        throw new InvalidOperationException("Nenhum dia útil sem feriado nos próximos 60 dias.");
    }
}

/// <summary>CNPJ fictício com dígitos verificadores válidos — o mesmo algoritmo do seed-demo.</summary>
public static class Cnpj
{
    public static string Random()
    {
        int[] digits = [.. Enumerable.Range(0, 12).Select(_ => RandomNumberGenerator.GetInt32(10))];
        int first = Check(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        int second = Check([.. digits, first], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        return string.Concat(digits.Append(first).Append(second));
    }

    private static int Check(int[] digits, int[] weights)
    {
        int rest = digits.Select((d, i) => d * weights[i]).Sum() % 11;
        return rest < 2 ? 0 : 11 - rest;
    }
}

/// <summary>
/// Solta todas as requisições no mesmo instante: cada tarefa já está rodando e parada na barreira antes de a
/// barreira abrir. Sem <c>Thread.Sleep</c>.
/// </summary>
public static class Concurrently
{
    public static async Task<HttpResponseMessage[]> SendAsync(HttpClient client, IReadOnlyList<HttpRequestMessage> requests)
    {
        var gate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var allWaiting = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        int waiting = 0;

        Task<HttpResponseMessage>[] inFlight =
        [
            .. requests.Select(request => Task.Run(async () =>
            {
                if (Interlocked.Increment(ref waiting) == requests.Count)
                {
                    allWaiting.SetResult();
                }

                await gate.Task;
                return await client.SendAsync(request);
            })),
        ];

        await allWaiting.Task;
        gate.SetResult();
        return await Task.WhenAll(inFlight);
    }
}
