using System.Reflection;

namespace Booking.Application;

/// <summary>Âncora do assembly para os testes de arquitetura.</summary>
public static class AssemblyReference
{
    public static Assembly Assembly => typeof(AssemblyReference).Assembly;
}
