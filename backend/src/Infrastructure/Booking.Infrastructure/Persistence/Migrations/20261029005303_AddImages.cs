using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <summary>
/// ADR-023: imagens do estabelecimento (logotipo e capa) e foto do profissional. O banco guarda só a referência ao
/// armazenamento de arquivos; os bytes ficam no volume <c>media-data</c>. Aditiva: três colunas nulas.
/// </summary>
public partial class AddImages : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "photo_image_key",
            schema: "people",
            table: "professional",
            type: "character varying(200)",
            maxLength: 200,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "cover_image_key",
            schema: "tenancy",
            table: "business",
            type: "character varying(200)",
            maxLength: 200,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "logo_image_key",
            schema: "tenancy",
            table: "business",
            type: "character varying(200)",
            maxLength: 200,
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "photo_image_key",
            schema: "people",
            table: "professional");

        migrationBuilder.DropColumn(
            name: "cover_image_key",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "logo_image_key",
            schema: "tenancy",
            table: "business");
    }
}
