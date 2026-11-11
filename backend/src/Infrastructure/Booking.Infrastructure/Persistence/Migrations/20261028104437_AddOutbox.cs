using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <summary>
/// ADR-021: a tabela <c>outbox</c> das decisões de 22/09, no schema do módulo Notifications. Aditiva: schema e tabela
/// novos, sem tocar em nada que existe.
/// </summary>
public partial class AddOutbox : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(
            name: "notifications");

        migrationBuilder.CreateTable(
            name: "outbox",
            schema: "notifications",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                payload = table.Column<string>(type: "jsonb", nullable: false),
                next_attempt_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                attempts = table.Column<int>(type: "integer", nullable: false),
                locked_until = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                processed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                failed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                last_error = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_outbox", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "ix_outbox_pending_next_attempt_at",
            schema: "notifications",
            table: "outbox",
            column: "next_attempt_at",
            filter: "processed_at IS NULL AND failed_at IS NULL");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "outbox",
            schema: "notifications");
    }
}
