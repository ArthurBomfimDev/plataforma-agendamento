using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddReviewReport : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "report_closed_at",
            schema: "reputation",
            table: "review",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "report_reason",
            schema: "reputation",
            table: "review",
            type: "character varying(500)",
            maxLength: 500,
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "reported_at",
            schema: "reputation",
            table: "review",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "reported_by_user_id",
            schema: "reputation",
            table: "review",
            type: "uuid",
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "report_closed_at",
            schema: "reputation",
            table: "review");

        migrationBuilder.DropColumn(
            name: "report_reason",
            schema: "reputation",
            table: "review");

        migrationBuilder.DropColumn(
            name: "reported_at",
            schema: "reputation",
            table: "review");

        migrationBuilder.DropColumn(
            name: "reported_by_user_id",
            schema: "reputation",
            table: "review");
    }
}
