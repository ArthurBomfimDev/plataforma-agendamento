namespace Booking.Api.Common;

/// <summary>Nomes das políticas de limite de taxa do cadastro de estabelecimento (freios contra abuso, Fase 3).</summary>
public static class RateLimits
{
    /// <summary>Criar estabelecimento: 5 por hora por conta. Complementa o limite de 3 estabelecimentos por conta.</summary>
    public const string BusinessCreate = "business-create";

    /// <summary>Denunciar na página pública: 5 por hora por IP (a rota é anônima).</summary>
    public const string Report = "report";

    /// <summary>Enviar ou reenviar convite de equipe: 30 por hora por conta.</summary>
    public const string InvitationSend = "invitation-send";

    /// <summary>Prévia e aceite do convite, rotas do link: 20 por hora por IP.</summary>
    public const string InvitationLink = "invitation-link";

    /// <summary>Avaliar ou editar avaliação: 10 por hora por conta (Fase 8). Cada agendamento só admite uma, então é folga.</summary>
    public const string Review = "review";
}
