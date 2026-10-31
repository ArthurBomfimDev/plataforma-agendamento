using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <summary>
/// Onda 6A: o login passa a exigir e-mail confirmado. Contas criadas antes da regra são marcadas como confirmadas
/// na data do cadastro, para não trancar ninguém. Só dado, sem mudança de schema; roda uma vez, então contas criadas
/// depois seguem a regra.
/// </summary>
public partial class ConfirmExistingAccounts : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE identity."user"
            SET email_confirmed_at = created_at
            WHERE email_confirmed_at IS NULL;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Sem volta: depois da migration não há como distinguir a conta confirmada por ela da confirmada pelo link.
    }
}
