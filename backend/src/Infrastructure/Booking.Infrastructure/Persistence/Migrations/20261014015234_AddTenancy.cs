using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddTenancy : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "ix_holiday_date",
            schema: "availability",
            table: "holiday");

        migrationBuilder.EnsureSchema(
            name: "tenancy");

        migrationBuilder.RenameColumn(
            name: "update_at",
            schema: "identity",
            table: "user_token",
            newName: "updated_at");

        migrationBuilder.RenameColumn(
            name: "update_at",
            schema: "identity",
            table: "user",
            newName: "updated_at");

        migrationBuilder.RenameColumn(
            name: "update_at",
            schema: "identity",
            table: "refresh_token",
            newName: "updated_at");

        migrationBuilder.CreateTable(
            name: "business",
            schema: "tenancy",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                document_number = table.Column<string>(type: "character varying(14)", maxLength: 14, nullable: false),
                category = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                seat_limit = table.Column<int>(type: "integer", nullable: false),
                verification_level = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                verified_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                verified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                verification_note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                location = table.Column<Point>(type: "geography (point)", nullable: true),
                location_precision = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                location_source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                geocoded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                location_confirmed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_business", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "business_membership",
            schema: "tenancy",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                accepted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                removed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_business_membership", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "ix_business_document_number",
            schema: "tenancy",
            table: "business",
            column: "document_number",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_business_membership_business_id",
            schema: "tenancy",
            table: "business_membership",
            column: "business_id");

        migrationBuilder.CreateIndex(
            name: "ix_business_membership_business_id_user_id",
            schema: "tenancy",
            table: "business_membership",
            columns: new[] { "business_id", "user_id" },
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "business",
            schema: "tenancy");

        migrationBuilder.DropTable(
            name: "business_membership",
            schema: "tenancy");

        migrationBuilder.RenameColumn(
            name: "updated_at",
            schema: "identity",
            table: "user_token",
            newName: "update_at");

        migrationBuilder.RenameColumn(
            name: "updated_at",
            schema: "identity",
            table: "user",
            newName: "update_at");

        migrationBuilder.RenameColumn(
            name: "updated_at",
            schema: "identity",
            table: "refresh_token",
            newName: "update_at");

        migrationBuilder.CreateIndex(
            name: "ix_holiday_date",
            schema: "availability",
            table: "holiday",
            column: "date",
            unique: true);
    }
}
