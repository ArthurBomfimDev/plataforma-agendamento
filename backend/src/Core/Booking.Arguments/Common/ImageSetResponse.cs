namespace Booking.Arguments.Common;

/// <summary>
/// Uma imagem em três tamanhos, todos WebP (ADR-023). As URLs podem ser relativas à API (<c>/media/…</c>, disco
/// local) ou absolutas (armazenamento externo): o frontend prefixa só as relativas.
/// </summary>
public sealed record ImageSetResponse(string Small, string Medium, string Large);
