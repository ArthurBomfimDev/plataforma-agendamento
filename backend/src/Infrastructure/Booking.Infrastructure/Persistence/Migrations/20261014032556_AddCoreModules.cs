using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Booking.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class AddCoreModules : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(
            name: "scheduling");

        migrationBuilder.EnsureSchema(
            name: "compliance");

        migrationBuilder.EnsureSchema(
            name: "people");

        migrationBuilder.EnsureSchema(
            name: "catalog");

        migrationBuilder.AddColumn<bool>(
            name: "auto_confirm",
            schema: "tenancy",
            table: "business",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<int>(
            name: "booking_horizon_days",
            schema: "tenancy",
            table: "business",
            type: "integer",
            nullable: false,
            defaultValue: 60);

        migrationBuilder.AddColumn<int>(
            name: "cancellation_window_hours",
            schema: "tenancy",
            table: "business",
            type: "integer",
            nullable: false,
            defaultValue: 24);

        migrationBuilder.AddColumn<string>(
            name: "city",
            schema: "tenancy",
            table: "business",
            type: "character varying(100)",
            maxLength: 100,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "district",
            schema: "tenancy",
            table: "business",
            type: "character varying(100)",
            maxLength: 100,
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "min_lead_time_hours",
            schema: "tenancy",
            table: "business",
            type: "integer",
            nullable: false,
            defaultValue: 2);

        migrationBuilder.AddColumn<int>(
            name: "pending_expiration_hours",
            schema: "tenancy",
            table: "business",
            type: "integer",
            nullable: false,
            defaultValue: 12);

        migrationBuilder.AddColumn<string>(
            name: "postal_code",
            schema: "tenancy",
            table: "business",
            type: "character varying(8)",
            maxLength: 8,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "state",
            schema: "tenancy",
            table: "business",
            type: "character varying(2)",
            maxLength: 2,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "street",
            schema: "tenancy",
            table: "business",
            type: "character varying(150)",
            maxLength: 150,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "street_number",
            schema: "tenancy",
            table: "business",
            type: "character varying(20)",
            maxLength: 20,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "time_zone",
            schema: "tenancy",
            table: "business",
            type: "character varying(64)",
            maxLength: 64,
            nullable: false,
            defaultValue: "America/Sao_Paulo");

        migrationBuilder.CreateTable(
            name: "appointment",
            schema: "scheduling",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                professional_id = table.Column<Guid>(type: "uuid", nullable: false),
                service_id = table.Column<Guid>(type: "uuid", nullable: false),
                customer_id = table.Column<Guid>(type: "uuid", nullable: true),
                walk_in_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                walk_in_phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ends_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                blocked_starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                blocked_ends_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                service_name_snapshot = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                duration_minutes = table.Column<int>(type: "integer", nullable: false),
                buffer_before_minutes = table.Column<int>(type: "integer", nullable: false),
                buffer_after_minutes = table.Column<int>(type: "integer", nullable: false),
                price_cents = table.Column<long>(type: "bigint", nullable: false),
                is_sensitive = table.Column<bool>(type: "boolean", nullable: false),
                status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                customer_notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                business_notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                requested_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                confirmed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                cancelled_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                cancelled_by = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                cancellation_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                idempotency_key = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_appointment", x => x.id);
                table.CheckConstraint("ck_appointment_blocked_range", "blocked_starts_at <= starts_at AND blocked_ends_at >= ends_at");
                table.CheckConstraint("ck_appointment_period", "ends_at > starts_at");
            });

        migrationBuilder.CreateTable(
            name: "consent_record",
            schema: "compliance",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                purpose = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                version = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                granted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                revoked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_consent_record", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "customer",
            schema: "people",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                birth_date = table.Column<DateOnly>(type: "date", nullable: false),
                social_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_customer", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "professional",
            schema: "people",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                business_membership_id = table.Column<Guid>(type: "uuid", nullable: true),
                display_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                specialty = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                bio = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                is_publicly_visible = table.Column<bool>(type: "boolean", nullable: false),
                public_profile_consent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_professional", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "schedule_exception",
            schema: "availability",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                professional_id = table.Column<Guid>(type: "uuid", nullable: true),
                kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                starts_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ends_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                reason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_schedule_exception", x => x.id);
                table.CheckConstraint("ck_schedule_exception_period", "ends_at > starts_at");
            });

        migrationBuilder.CreateTable(
            name: "sensitive_access_log",
            schema: "compliance",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                actor_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                appointment_id = table.Column<Guid>(type: "uuid", nullable: false),
                action = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                occurred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_sensitive_access_log", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "service",
            schema: "catalog",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                duration_minutes = table.Column<int>(type: "integer", nullable: false),
                buffer_before_minutes = table.Column<int>(type: "integer", nullable: false),
                buffer_after_minutes = table.Column<int>(type: "integer", nullable: false),
                slot_step_minutes = table.Column<int>(type: "integer", nullable: false),
                price_cents = table.Column<long>(type: "bigint", nullable: false),
                supplies_note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_service", x => x.id);
                table.CheckConstraint("ck_service_duration", "duration_minutes > 0 AND duration_minutes <= 480");
                table.CheckConstraint("ck_service_price", "price_cents >= 0");
            });

        migrationBuilder.CreateTable(
            name: "work_schedule",
            schema: "availability",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                professional_id = table.Column<Guid>(type: "uuid", nullable: false),
                day_of_week = table.Column<int>(type: "integer", nullable: false),
                start_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                end_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                effective_from = table.Column<DateOnly>(type: "date", nullable: false),
                effective_to = table.Column<DateOnly>(type: "date", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_work_schedule", x => x.id);
                table.CheckConstraint("ck_work_schedule_time", "end_time > start_time");
            });

        migrationBuilder.CreateTable(
            name: "appointment_event",
            schema: "scheduling",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                appointment_id = table.Column<Guid>(type: "uuid", nullable: false),
                from_status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                to_status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                actor_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                actor_role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                occurred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_appointment_event", x => x.id);
                table.ForeignKey(
                    name: "fk_appointment_event_appointment_appointment_id",
                    column: x => x.appointment_id,
                    principalSchema: "scheduling",
                    principalTable: "appointment",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "service_professional",
            schema: "catalog",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                business_id = table.Column<Guid>(type: "uuid", nullable: false),
                service_id = table.Column<Guid>(type: "uuid", nullable: false),
                professional_id = table.Column<Guid>(type: "uuid", nullable: false),
                price_override_cents = table.Column<long>(type: "bigint", nullable: true),
                duration_override_minutes = table.Column<int>(type: "integer", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_service_professional", x => x.id);
                table.ForeignKey(
                    name: "fk_service_professional_service_service_id",
                    column: x => x.service_id,
                    principalSchema: "catalog",
                    principalTable: "service",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "ix_business_location",
            schema: "tenancy",
            table: "business",
            column: "location")
            .Annotation("Npgsql:IndexMethod", "gist");

        migrationBuilder.CreateIndex(
            name: "ix_appointment_business_id",
            schema: "scheduling",
            table: "appointment",
            column: "business_id");

        migrationBuilder.CreateIndex(
            name: "ix_appointment_business_id_starts_at",
            schema: "scheduling",
            table: "appointment",
            columns: new[] { "business_id", "starts_at" });

        migrationBuilder.CreateIndex(
            name: "ix_appointment_customer_id_idempotency_key",
            schema: "scheduling",
            table: "appointment",
            columns: new[] { "customer_id", "idempotency_key" },
            unique: true,
            filter: "idempotency_key IS NOT NULL");

        migrationBuilder.CreateIndex(
            name: "ix_appointment_customer_id_starts_at",
            schema: "scheduling",
            table: "appointment",
            columns: new[] { "customer_id", "starts_at" });

        migrationBuilder.CreateIndex(
            name: "ix_appointment_status_expires_at",
            schema: "scheduling",
            table: "appointment",
            columns: new[] { "status", "expires_at" });

        migrationBuilder.CreateIndex(
            name: "ix_appointment_event_appointment_id_occurred_at",
            schema: "scheduling",
            table: "appointment_event",
            columns: new[] { "appointment_id", "occurred_at" });

        migrationBuilder.CreateIndex(
            name: "ix_appointment_event_business_id",
            schema: "scheduling",
            table: "appointment_event",
            column: "business_id");

        migrationBuilder.CreateIndex(
            name: "ix_consent_record_user_id_purpose",
            schema: "compliance",
            table: "consent_record",
            columns: new[] { "user_id", "purpose" });

        migrationBuilder.CreateIndex(
            name: "ix_customer_user_id",
            schema: "people",
            table: "customer",
            column: "user_id",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_professional_business_id",
            schema: "people",
            table: "professional",
            column: "business_id");

        migrationBuilder.CreateIndex(
            name: "ix_professional_business_membership_id",
            schema: "people",
            table: "professional",
            column: "business_membership_id",
            unique: true,
            filter: "business_membership_id IS NOT NULL");

        migrationBuilder.CreateIndex(
            name: "ix_schedule_exception_business_id",
            schema: "availability",
            table: "schedule_exception",
            column: "business_id");

        migrationBuilder.CreateIndex(
            name: "ix_schedule_exception_business_id_professional_id_starts_at",
            schema: "availability",
            table: "schedule_exception",
            columns: new[] { "business_id", "professional_id", "starts_at" });

        migrationBuilder.CreateIndex(
            name: "ix_sensitive_access_log_appointment_id_occurred_at",
            schema: "compliance",
            table: "sensitive_access_log",
            columns: new[] { "appointment_id", "occurred_at" });

        migrationBuilder.CreateIndex(
            name: "ix_sensitive_access_log_business_id",
            schema: "compliance",
            table: "sensitive_access_log",
            column: "business_id");

        migrationBuilder.CreateIndex(
            name: "ix_service_business_id",
            schema: "catalog",
            table: "service",
            column: "business_id");

        migrationBuilder.CreateIndex(
            name: "ix_service_professional_business_id",
            schema: "catalog",
            table: "service_professional",
            column: "business_id");

        migrationBuilder.CreateIndex(
            name: "ix_service_professional_professional_id",
            schema: "catalog",
            table: "service_professional",
            column: "professional_id");

        migrationBuilder.CreateIndex(
            name: "ix_service_professional_service_id_professional_id",
            schema: "catalog",
            table: "service_professional",
            columns: new[] { "service_id", "professional_id" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_work_schedule_business_id",
            schema: "availability",
            table: "work_schedule",
            column: "business_id");

        migrationBuilder.CreateIndex(
            name: "ix_work_schedule_business_id_professional_id_day_of_week",
            schema: "availability",
            table: "work_schedule",
            columns: new[] { "business_id", "professional_id", "day_of_week" });

        // ADR-005: a garantia contra dupla reserva. O modelo do EF não descreve EXCLUDE USING gist; este SQL é a fonte.
        // O intervalo vem de colunas gravadas, e não de coluna gerada: timestamptz - interval é STABLE e coluna gerada
        // exige IMMUTABLE. tstzrange(timestamptz, timestamptz, text) é IMMUTABLE e pode entrar no índice GiST.
        // ⚠️ Os nomes dos estados no WHERE precisam bater com AppointmentStatus, que é gravado como texto.
        migrationBuilder.Sql("""
            ALTER TABLE scheduling.appointment
                ADD CONSTRAINT appointment_no_overlap
                EXCLUDE USING gist (
                    professional_id WITH =,
                    tstzrange(blocked_starts_at, blocked_ends_at, '[)') WITH &&
                ) WHERE (status IN ('Pending', 'Confirmed', 'Completed', 'NoShow'));
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "appointment_event",
            schema: "scheduling");

        migrationBuilder.DropTable(
            name: "consent_record",
            schema: "compliance");

        migrationBuilder.DropTable(
            name: "customer",
            schema: "people");

        migrationBuilder.DropTable(
            name: "professional",
            schema: "people");

        migrationBuilder.DropTable(
            name: "schedule_exception",
            schema: "availability");

        migrationBuilder.DropTable(
            name: "sensitive_access_log",
            schema: "compliance");

        migrationBuilder.DropTable(
            name: "service_professional",
            schema: "catalog");

        migrationBuilder.DropTable(
            name: "work_schedule",
            schema: "availability");

        migrationBuilder.DropTable(
            name: "appointment",
            schema: "scheduling");

        migrationBuilder.DropTable(
            name: "service",
            schema: "catalog");

        migrationBuilder.DropIndex(
            name: "ix_business_location",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "auto_confirm",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "booking_horizon_days",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "cancellation_window_hours",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "city",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "district",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "min_lead_time_hours",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "pending_expiration_hours",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "postal_code",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "state",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "street",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "street_number",
            schema: "tenancy",
            table: "business");

        migrationBuilder.DropColumn(
            name: "time_zone",
            schema: "tenancy",
            table: "business");
    }
}
