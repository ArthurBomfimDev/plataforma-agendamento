using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddProfessionalRemovalRequest : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "professional_removal_request",
            schema: "people",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                professional_id = table.Column<Guid>(type: "uuid", nullable: false),
                reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                contact = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                requested_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                resolved_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                resolved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                resolution = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_professional_removal_request", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "ix_professional_removal_request_professional_id",
            schema: "people",
            table: "professional_removal_request",
            column: "professional_id");

        migrationBuilder.CreateIndex(
            name: "ix_professional_removal_request_status",
            schema: "people",
            table: "professional_removal_request",
            column: "status");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "professional_removal_request",
            schema: "people");
    }
}
