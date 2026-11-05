using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <summary>
/// ADR-020: papel de Admin da plataforma. Aditiva: coluna nova com default <c>false</c>, então toda conta
/// existente continua sem o papel.
/// </summary>
public partial class AddPlatformAdmin : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "is_platform_admin",
            schema: "identity",
            table: "user",
            type: "boolean",
            nullable: false,
            defaultValue: false);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "is_platform_admin",
            schema: "identity",
            table: "user");
    }
}
