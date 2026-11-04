using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddReputation : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(
            name: "reputation");

        migrationBuilder.CreateTable(
            name: "rating_summary",
            schema: "reputation",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                target = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                target_id = table.Column<Guid>(type: "uuid", nullable: false),
                count = table.Column<int>(type: "integer", nullable: false),
                sum = table.Column<long>(type: "bigint", nullable: false),
                stars1 = table.Column<int>(type: "integer", nullable: false),
                stars2 = table.Column<int>(type: "integer", nullable: false),
                stars3 = table.Column<int>(type: "integer", nullable: false),
                stars4 = table.Column<int>(type: "integer", nullable: false),
                stars5 = table.Column<int>(type: "integer", nullable: false),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_rating_summary", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "review",
            schema: "reputation",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                appointment_id = table.Column<Guid>(type: "uuid", nullable: false),
                professional_id = table.Column<Guid>(type: "uuid", nullable: false),
                customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                rating = table.Column<int>(type: "integer", nullable: false),
                professional_rating = table.Column<int>(type: "integer", nullable: true),
                comment = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                reviewer_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                service_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                is_sensitive = table.Column<bool>(type: "boolean", nullable: false),
                reviewed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                edited_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                is_hidden = table.Column<bool>(type: "boolean", nullable: false),
                hidden_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                hidden_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                hidden_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_review", x => x.id);
                table.CheckConstraint("ck_review_professional_rating", "professional_rating IS NULL OR professional_rating BETWEEN 1 AND 5");
                table.CheckConstraint("ck_review_rating", "rating BETWEEN 1 AND 5");
            });

        migrationBuilder.CreateIndex(
            name: "ix_rating_summary_business_id",
            schema: "reputation",
            table: "rating_summary",
            column: "business_id");

        migrationBuilder.CreateIndex(
            name: "ux_rating_summary_target",
            schema: "reputation",
            table: "rating_summary",
            columns: new[] { "target", "target_id" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_review_business_id",
            schema: "reputation",
            table: "review",
            column: "business_id");

        migrationBuilder.CreateIndex(
            name: "ix_review_business_id_is_hidden_reviewed_at",
            schema: "reputation",
            table: "review",
            columns: new[] { "business_id", "is_hidden", "reviewed_at" });

        migrationBuilder.CreateIndex(
            name: "ix_review_customer_id",
            schema: "reputation",
            table: "review",
            column: "customer_id");

        migrationBuilder.CreateIndex(
            name: "ix_review_professional_id_is_hidden_reviewed_at",
            schema: "reputation",
            table: "review",
            columns: new[] { "professional_id", "is_hidden", "reviewed_at" });

        migrationBuilder.CreateIndex(
            name: "ux_review_appointment",
            schema: "reputation",
            table: "review",
            column: "appointment_id",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "rating_summary",
            schema: "reputation");

        migrationBuilder.DropTable(
            name: "review",
            schema: "reputation");
    }
}
