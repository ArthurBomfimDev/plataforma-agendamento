namespace Booking.Domain.Exceptions;

/// <param name="code">Código estável, usado pelo frontend para traduzir a mensagem.</param>
/// <param name="details">Dados extras para o cliente da API — por exemplo, horários alternativos num conflito.</param>
public sealed class DomainException(string code, IReadOnlyDictionary<string, object?>? details = null) : System.Exception(code)
{
    public string Code { get; } = code;

    public IReadOnlyDictionary<string, object?> Details { get; } = details ?? new Dictionary<string, object?>();
}
