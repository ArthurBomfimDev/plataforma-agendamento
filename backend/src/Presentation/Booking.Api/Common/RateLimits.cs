namespace Booking.Api.Common;

/// <summary>Nomes das políticas de limite de taxa do cadastro de estabelecimento (freios contra abuso, Fase 3).</summary>
public static class RateLimits
{
    /// <summary>Criar estabelecimento: 5 por hora por conta. Complementa o limite de 3 estabelecimentos por conta.</summary>
    public const string BusinessCreate = "business-create";

    /// <summary>Denunciar na página pública: 5 por hora por IP (a rota é anônima).</summary>
    public const string Report = "report";
}
