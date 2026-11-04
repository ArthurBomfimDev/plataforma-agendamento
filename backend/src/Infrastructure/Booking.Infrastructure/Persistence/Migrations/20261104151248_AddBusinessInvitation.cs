using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddBusinessInvitation : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "business_invitation",
            schema: "tenancy",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: false),
                invitee_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                professional_id = table.Column<Guid>(type: "uuid", nullable: true),
                invited_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                token_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                last_sent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                accepted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                accepted_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                revoked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                terms_version = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                terms_accepted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_business_invitation", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "ix_business_invitation_business_id",
            schema: "tenancy",
            table: "business_invitation",
            column: "business_id");

        migrationBuilder.CreateIndex(
            name: "ix_business_invitation_business_id_email",
            schema: "tenancy",
            table: "business_invitation",
            columns: new[] { "business_id", "email" });

        migrationBuilder.CreateIndex(
            name: "ix_business_invitation_token_hash",
            schema: "tenancy",
            table: "business_invitation",
            column: "token_hash",
            unique: true);

        // O limite de vagas passa de 1 (valor antigo, que travava qualquer convite) para 15. Quem já tinha outro
        // valor, definido pelo Admin, não é tocado.
        migrationBuilder.Sql("UPDATE tenancy.business SET seat_limit = 15 WHERE seat_limit = 1;");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "business_invitation",
            schema: "tenancy");
    }
}
