using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AllowWorkScheduleClosingAtMidnight : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropCheckConstraint(
            name: "ck_work_schedule_time",
            schema: "availability",
            table: "work_schedule");

        migrationBuilder.AddCheckConstraint(
            name: "ck_work_schedule_time",
            schema: "availability",
            table: "work_schedule",
            sql: "end_time > start_time OR (end_time = '00:00:00' AND start_time > '00:00:00')");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropCheckConstraint(
            name: "ck_work_schedule_time",
            schema: "availability",
            table: "work_schedule");

        migrationBuilder.AddCheckConstraint(
            name: "ck_work_schedule_time",
            schema: "availability",
            table: "work_schedule",
            sql: "end_time > start_time");
    }
}
