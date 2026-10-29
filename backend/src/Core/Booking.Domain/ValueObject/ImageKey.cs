using System.Text.RegularExpressions;
using Booking.Domain.Exceptions;

namespace Booking.Domain.ValueObject;

/// <summary>
/// Referência a uma imagem guardada fora do banco (ADR-023): o banco guarda só este caminho; os bytes ficam no
/// armazenamento de arquivos. Formato fixo, gerado pelo sistema — nunca o nome enviado —, sem <c>..</c>, barra
/// invertida nem caminho absoluto: impossível apontar para fora da pasta de mídia.
/// </summary>
public static partial class ImageKey
{
    public const int MaxLength = 200;

    public static string Ensure(string key)
    {
        if (string.IsNullOrWhiteSpace(key) || key.Length > MaxLength || !Pattern().IsMatch(key))
        {
            throw new DomainException("image.key_invalid");
        }

        return key;
    }

    // Segmentos de letras minúsculas, dígitos e hífen, separados por "/": "businesses/0193…/a1b2…".
    [GeneratedRegex("^[a-z0-9][a-z0-9-]*(/[a-z0-9][a-z0-9-]*)*$")]
    private static partial Regex Pattern();
}
