using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.ValueObject;

namespace Booking.UnitTests.Tenancy;

/// <summary>Versão B da regra de cadastro (ADR-028): CPF ou CNPJ em toda categoria, e MEI só com CNPJ.</summary>
public sealed class BusinessDocumentRuleTests
{
    private const string _validCpf = "529.982.247-25";
    private const string _validCnpj = "11.222.333/0001-81";

    [Theory]
    [InlineData(BusinessCategory.Beleza, _validCpf, DocumentKind.Cpf)]
    [InlineData(BusinessCategory.Saude, _validCpf, DocumentKind.Cpf)]
    [InlineData(BusinessCategory.Beleza, _validCnpj, DocumentKind.Cnpj)]
    [InlineData(BusinessCategory.Saude, _validCnpj, DocumentKind.Cnpj)]
    public void Every_category_takes_cpf_or_cnpj_and_keeps_the_type(BusinessCategory category, string document, DocumentKind type)
    {
        Business business = Business.Create("Estabelecimento", Document.Of(document), category);

        Assert.Equal(type, business.DocumentType);
        Assert.False(business.IsMei);
    }

    [Fact]
    public void Mei_is_kept_with_cnpj() =>
        Assert.True(Business.Create("Estabelecimento", Document.Of(_validCnpj), BusinessCategory.Beleza, isMei: true).IsMei);

    [Fact]
    public void Mei_with_cpf_is_refused()
    {
        DomainException error = Assert.Throws<DomainException>(
            () => Business.Create("Estabelecimento", Document.Of(_validCpf), BusinessCategory.Beleza, isMei: true));

        Assert.Equal("business.mei_requires_cnpj", error.Code);
    }
}
