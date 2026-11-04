using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class ReplaceProfessionalConsentWithDeclaration : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "is_publicly_visible",
            schema: "people",
            table: "professional");

        // Não é renomear: o consentimento era do próprio profissional; a declaração é do dono (outra pessoa, outro fato).
        // O consentimento antigo é descartado de propósito (ADR-031).
        migrationBuilder.DropColumn(
            name: "public_profile_consent_at",
            schema: "people",
            table: "professional");

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "authorization_declared_at",
            schema: "people",
            table: "professional",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "authorization_declaration_version",
            schema: "people",
            table: "professional",
            type: "character varying(60)",
            maxLength: 60,
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "authorization_declared_by_user_id",
            schema: "people",
            table: "professional",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "registration",
            schema: "people",
            table: "professional",
            type: "character varying(40)",
            maxLength: 40,
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "authorization_declaration_version",
            schema: "people",
            table: "professional");

        migrationBuilder.DropColumn(
            name: "authorization_declared_by_user_id",
            schema: "people",
            table: "professional");

        migrationBuilder.DropColumn(
            name: "registration",
            schema: "people",
            table: "professional");

        migrationBuilder.DropColumn(
            name: "authorization_declared_at",
            schema: "people",
            table: "professional");

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "public_profile_consent_at",
            schema: "people",
            table: "professional",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "is_publicly_visible",
            schema: "people",
            table: "professional",
            type: "boolean",
            nullable: false,
            defaultValue: false);
    }
}
