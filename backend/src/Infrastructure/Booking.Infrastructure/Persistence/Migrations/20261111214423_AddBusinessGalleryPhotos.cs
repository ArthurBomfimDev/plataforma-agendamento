using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddBusinessGalleryPhotos : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "second_photo_image_key",
            schema: "tenancy",
            table: "business",
            type: "character varying(200)",
            maxLength: 200,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "third_photo_image_key",
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
            name: "second_photo_image_key",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "third_photo_image_key",
            schema: "tenancy",
            table: "business");
    }
}
