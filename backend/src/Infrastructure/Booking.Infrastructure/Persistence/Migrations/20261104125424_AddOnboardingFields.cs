using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddOnboardingFields : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "responsible_council",
            schema: "tenancy",
            table: "business",
            type: "character varying(20)",
            maxLength: 20,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "responsible_council_number",
            schema: "tenancy",
            table: "business",
            type: "character varying(20)",
            maxLength: 20,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "responsible_council_state",
            schema: "tenancy",
            table: "business",
            type: "character varying(2)",
            maxLength: 2,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "responsible_name",
            schema: "tenancy",
            table: "business",
            type: "character varying(150)",
            maxLength: 150,
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "suspended_at",
            schema: "tenancy",
            table: "business",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "suspended_by_user_id",
            schema: "tenancy",
            table: "business",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "suspension_reason",
            schema: "tenancy",
            table: "business",
            type: "character varying(500)",
            maxLength: 500,
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "terms_accepted_at",
            schema: "tenancy",
            table: "business",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "terms_version",
            schema: "tenancy",
            table: "business",
            type: "character varying(20)",
            maxLength: 20,
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "responsible_council",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "responsible_council_number",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "responsible_council_state",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "responsible_name",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "suspended_at",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "suspended_by_user_id",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "suspension_reason",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "terms_accepted_at",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "terms_version",
            schema: "tenancy",
            table: "business");
    }
}
