using System.Reflection;

namespace Booking.Arguments;

public static class AssemblyReference
{
    public static Assembly Assembly => typeof(AssemblyReference).Assembly;
}
