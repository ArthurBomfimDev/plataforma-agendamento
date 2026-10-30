using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class InitialIdentity : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(
            name: "availability");

        migrationBuilder.EnsureSchema(
            name: "identity");

        migrationBuilder.AlterDatabase()
            .Annotation("Npgsql:PostgresExtension:btree_gist", ",,")
            .Annotation("Npgsql:PostgresExtension:postgis", ",,");

        migrationBuilder.CreateTable(
            name: "holiday",
            schema: "availability",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                date = table.Column<DateOnly>(type: "date", nullable: false),
                name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_holiday", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "user",
            schema: "identity",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                full_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                email_confirmed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                update_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_user", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "refresh_token",
            schema: "identity",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                token_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                revoked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                replaced_by_token_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                update_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_refresh_token", x => x.id);
                table.ForeignKey(
                    name: "fk_refresh_token_user_user_id",
                    column: x => x.user_id,
                    principalSchema: "identity",
                    principalTable: "user",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "user_token",
            schema: "identity",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                token_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                used_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                update_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_user_token", x => x.id);
                table.ForeignKey(
                    name: "fk_user_token_user_user_id",
                    column: x => x.user_id,
                    principalSchema: "identity",
                    principalTable: "user",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "ix_holiday_date",
            schema: "availability",
            table: "holiday",
            column: "date",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_holiday_date_name",
            schema: "availability",
            table: "holiday",
            columns: new[] { "date", "name" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_refresh_token_token_hash",
            schema: "identity",
            table: "refresh_token",
            column: "token_hash",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_refresh_token_user_id",
            schema: "identity",
            table: "refresh_token",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "ix_user_email",
            schema: "identity",
            table: "user",
            column: "email",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_user_token_type_token_hash",
            schema: "identity",
            table: "user_token",
            columns: new[] { "type", "token_hash" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_user_token_user_id",
            schema: "identity",
            table: "user_token",
            column: "user_id");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "holiday",
            schema: "availability");

        migrationBuilder.DropTable(
            name: "refresh_token",
            schema: "identity");

        migrationBuilder.DropTable(
            name: "user_token",
            schema: "identity");

        migrationBuilder.DropTable(
            name: "user",
            schema: "identity");
    }
}
