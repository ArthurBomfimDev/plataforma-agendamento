using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddBusinessDocumentType : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "document_type",
            schema: "tenancy",
            table: "business",
            type: "character varying(4)",
            maxLength: 4,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<bool>(
            name: "is_mei",
            schema: "tenancy",
            table: "business",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        // Quem já existe: o tipo sai do documento. 11 caracteres é CPF, 14 é CNPJ (Document.Of já validou).
        migrationBuilder.Sql(
            "UPDATE tenancy.business SET document_type = CASE WHEN length(document_number) = 11 THEN 'Cpf' ELSE 'Cnpj' END;");

        migrationBuilder.AddCheckConstraint(
            name: "ck_business_mei_requires_cnpj",
            schema: "tenancy",
            table: "business",
            sql: "NOT is_mei OR document_type = 'Cnpj'");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropCheckConstraint(
            name: "ck_business_mei_requires_cnpj",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "document_type",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "is_mei",
            schema: "tenancy",
            table: "business");
    }
}
