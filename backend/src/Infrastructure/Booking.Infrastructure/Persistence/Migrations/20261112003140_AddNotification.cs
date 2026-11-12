using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddNotification : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "notification",
            schema: "notifications",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                audience = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: true),
                type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                body = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                occurred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                read_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_notification", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "ix_notification_unread",
            schema: "notifications",
            table: "notification",
            columns: new[] { "user_id", "audience", "business_id" },
            filter: "read_at IS NULL");

        migrationBuilder.CreateIndex(
            name: "ix_notification_user_side",
            schema: "notifications",
            table: "notification",
            columns: new[] { "user_id", "audience", "business_id", "occurred_at" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "notification",
            schema: "notifications");
    }
}
