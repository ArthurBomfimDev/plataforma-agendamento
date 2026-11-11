using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddAppointmentReminderMarks : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "day_before_reminder_sent_at",
            schema: "scheduling",
            table: "appointment",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "hour_before_reminder_sent_at",
            schema: "scheduling",
            table: "appointment",
            type: "timestamp with time zone",
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "day_before_reminder_sent_at",
            schema: "scheduling",
            table: "appointment");

        migrationBuilder.DropColumn(
            name: "hour_before_reminder_sent_at",
            schema: "scheduling",
            table: "appointment");
    }
}
