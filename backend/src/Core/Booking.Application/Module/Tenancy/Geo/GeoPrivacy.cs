namespace Booking.Application.Module.Tenancy.Geo;

/// <summary>
/// A coordenada do consumidor é dado pessoal (LGPD; decisões de 22/09 §5.5). Antes de sair para um terceiro, ela é
/// arredondada para 3 casas decimais — cerca de 110 m —, o bastante para dizer o bairro e não a casa. E nunca vai
/// para o log.
/// </summary>
public static class GeoPrivacy
{
    public const int Decimals = 3;

    public static double Round(double coordinate) => Math.Round(coordinate, Decimals, MidpointRounding.AwayFromZero);
}
