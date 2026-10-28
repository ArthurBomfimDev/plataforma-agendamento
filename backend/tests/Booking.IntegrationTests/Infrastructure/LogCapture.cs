using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace Booking.IntegrationTests.Infrastructure;

/// <summary>
/// Guarda em memória as mensagens de log de uma categoria (e das que começam por ela), em qualquer nível. Serve para
/// provar o que vai e o que não vai para o log.
/// </summary>
public sealed class LogCapture(string categoryPrefix) : ILoggerProvider
{
    private readonly ConcurrentQueue<(LogLevel Level, string Category, string Message)> _entries = new();

    public string CategoryPrefix => categoryPrefix;

    public IReadOnlyList<(LogLevel Level, string Category, string Message)> Entries => [.. _entries];

    public ILogger CreateLogger(string categoryName) =>
        categoryName.StartsWith(categoryPrefix, StringComparison.Ordinal) ? new Capturing(categoryName, _entries) : NullLogger.Instance;

    public void Dispose()
    {
    }

    private sealed class Capturing(string category, ConcurrentQueue<(LogLevel, string, string)> entries) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) =>
            entries.Enqueue((logLevel, category, formatter(state, exception)));
    }

    private sealed class NullLogger : ILogger
    {
        public static readonly NullLogger Instance = new();

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => false;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
        }
    }
}
