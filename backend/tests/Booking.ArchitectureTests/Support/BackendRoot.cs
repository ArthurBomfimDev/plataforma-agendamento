namespace Booking.ArchitectureTests.Support;

internal static class BackendRoot
{
    /// <summary>Sobe a partir da pasta do teste até achar <c>Booking.slnx</c>.</summary>
    public static DirectoryInfo Find()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);

        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "Booking.slnx")))
        {
            directory = directory.Parent;
        }

        return directory ?? throw new InvalidOperationException(
            $"Booking.slnx não encontrado acima de {AppContext.BaseDirectory}. O teste precisa rodar dentro de backend/.");
    }
}
