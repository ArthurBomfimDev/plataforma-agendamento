using Booking.ArchitectureTests.Support;
using NetArchTest.Rules;

namespace Booking.ArchitectureTests;

/// <summary>
/// Direção das dependências entre camadas: Presentation → Infrastructure → Application → Domain.
/// </summary>
/// <remarks>
/// As referências entre projetos já impedem parte disso. O que só o teste pega é pacote de framework
/// entrando no núcleo: EF Core ou ASP.NET referenciado direto no Domain ou no Application.
/// </remarks>
public sealed class LayerDependencyTests
{
    [Fact]
    public void Domain_depends_on_no_other_layer_and_no_framework()
    {
        TestResult result = Types.InAssembly(Booking.Domain.AssemblyReference.Assembly)
            .Should()
            .NotHaveDependencyOnAny(
                "Booking.Application",
                "Booking.Arguments",
                "Booking.Infrastructure",
                "Booking.Api",
                "Microsoft.EntityFrameworkCore",
                "Microsoft.AspNetCore")
            .GetResult();

        ArchAssert.Passes(result, "O domínio não pode depender de outra camada nem de framework.");
    }

    [Fact]
    public void Application_does_not_depend_on_infrastructure_or_presentation()
    {
        TestResult result = Types.InAssembly(Booking.Application.AssemblyReference.Assembly)
            .Should()
            .NotHaveDependencyOnAny(
                "Booking.Infrastructure",
                "Booking.Api",
                "Microsoft.EntityFrameworkCore",
                "Microsoft.AspNetCore")
            .GetResult();

        ArchAssert.Passes(result, "A aplicação não pode depender de infraestrutura, apresentação ou EF Core.");
    }

    [Fact]
    public void Arguments_do_not_depend_on_domain()
    {
        TestResult result = Types.InAssembly(Booking.Arguments.AssemblyReference.Assembly)
            .Should()
            .NotHaveDependencyOnAny("Booking.Domain", "Booking.Application", "Booking.Infrastructure", "Booking.Api")
            .GetResult();

        ArchAssert.Passes(
            result,
            "O contrato da API não pode depender do domínio: mudar uma entidade mudaria o contrato público sem aviso.");
    }
}
