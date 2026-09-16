namespace Booking.Domain.Base;

/// <summary>
/// Base de toda entidade do domínio.
/// </summary>
/// <remarks>
/// <para>
/// O identificador é Guid versão 7 (ADR-010, decisão 3). É ordenável no tempo, o que mantém o
/// índice B-tree compacto, e não é enumerável: a busca pública atravessa todos os estabelecimentos
/// no mesmo endpoint (ADR-003), e um id sequencial deixaria percorrer dado de outro tenant
/// incrementando um número.
/// </para>
/// <para>
/// O setter é privado. O EF Core preenche o valor na materialização pelo backing field;
/// nenhum código de aplicação troca o id de uma entidade existente.
/// </para>
/// </remarks>
public abstract class BaseEntity
{
    protected BaseEntity()
    {
        Id = Guid.CreateVersion7();
    }

    public Guid Id { get; private set; }
}
