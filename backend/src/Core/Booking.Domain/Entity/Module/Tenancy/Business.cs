using Booking.Domain.Entity.Base;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.ValueObject;

namespace Booking.Domain.Entity.Module.Tenancy;

public sealed class Business : AggregateRoot, IAuditable
{
    public const string DefaultTimeZone = "America/Sao_Paulo";

    public string Name { get; private set; } = null!;
    public Document Document { get; private set; } = null!;
    public BusinessCategory Category { get; private set; }
    public BusinessStatus Status { get; private set; }
    public int SeatLimit { get; private set; }

    /// <summary>Identificador IANA. Nunca offset fixo, que quebra no horário de verão.</summary>
    public string TimeZone { get; private set; } = DefaultTimeZone;

    public string? Street { get; private set; }
    public string? StreetNumber { get; private set; }
    public string? District { get; private set; }
    public string? City { get; private set; }
    public string? State { get; private set; }
    public string? PostalCode { get; private set; }

    // --- Política de agendamento (DOCUMENTO-GERAL §5.1) ---
    public bool AutoConfirm { get; private set; }
    public int PendingExpirationHours { get; private set; } = 12;
    public int MinLeadTimeHours { get; private set; } = 2;
    public int BookingHorizonDays { get; private set; } = 60;
    public int CancellationWindowHours { get; private set; } = 24;

    public VerificationLevel VerificationLevel { get; private set; }
    public Guid? VerifiedByUserId { get; private set; }
    public DateTimeOffset? VerifiedAt { get; private set; }
    public string? VerificationNote { get; private set; }

    public GeoPoint? Location { get; private set; }
    public LocationPrecision? LocationPrecision { get; private set; }
    public string? LocationSource { get; private set; }
    public DateTimeOffset? GeocodedAt { get; private set; }
    public DateTimeOffset? LocationConfirmedAt { get; private set; }

    /// <summary>Imagens (ADR-023): só a referência ao armazenamento de arquivos, nunca os bytes.</summary>
    public string? LogoImageKey { get; private set; }
    public string? CoverImageKey { get; private set; }

    private Business()
    {
    }

    public static Business Create(string name, Document document, BusinessCategory category)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("business.name_required");
        }

        return new Business
        {
            Name = name.Trim(),
            Document = document,
            Category = category,
            Status = BusinessStatus.Draft,
            VerificationLevel = VerificationLevel.Unverified,
            SeatLimit = 1,
        };
    }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new DomainException("business.name_required");
        }

        Name = name.Trim();
    }

    public void SetSeatLimit(int seatLimit)
    {
        if (seatLimit < 1)
        {
            throw new DomainException("business.seat_limit_invalid");
        }

        SeatLimit = seatLimit;
    }

    public void ChangeTimeZone(string timeZone)
    {
        if (string.IsNullOrWhiteSpace(timeZone) || !TimeZoneInfo.TryFindSystemTimeZoneById(timeZone, out _))
        {
            throw new DomainException("business.time_zone_invalid");
        }

        TimeZone = timeZone;
    }

    public void UpdateSchedulingPolicy(
        bool autoConfirm,
        int pendingExpirationHours,
        int minLeadTimeHours,
        int bookingHorizonDays,
        int cancellationWindowHours)
    {
        if (pendingExpirationHours is < 1 or > 72)
        {
            throw new DomainException("business.pending_expiration_invalid");
        }

        if (minLeadTimeHours is < 0 or > 72)
        {
            throw new DomainException("business.min_lead_time_invalid");
        }

        if (bookingHorizonDays is < 1 or > 365)
        {
            throw new DomainException("business.booking_horizon_invalid");
        }

        if (cancellationWindowHours is < 0 or > 48)
        {
            throw new DomainException("business.cancellation_window_invalid");
        }

        AutoConfirm = autoConfirm;
        PendingExpirationHours = pendingExpirationHours;
        MinLeadTimeHours = minLeadTimeHours;
        BookingHorizonDays = bookingHorizonDays;
        CancellationWindowHours = cancellationWindowHours;
    }

    // Endereço novo invalida o ponto: a confirmação anterior era de outro lugar (decisões de localização §5.4).
    public void UpdateAddress(string street, string streetNumber, string district, string city, string state, string postalCode)
    {
        if (string.IsNullOrWhiteSpace(street) || string.IsNullOrWhiteSpace(city) || string.IsNullOrWhiteSpace(state))
        {
            throw new DomainException("business.address_incomplete");
        }

        Street = street.Trim();
        StreetNumber = streetNumber?.Trim();
        District = district?.Trim();
        City = city.Trim();
        State = state.Trim().ToUpperInvariant();
        PostalCode = new string([.. (postalCode ?? string.Empty).Where(char.IsDigit)]);
        LocationConfirmedAt = null;
    }

    // --- Ciclo de vida operacional ---
    // A checklist (endereço confirmado, ≥1 serviço, ≥1 profissional, ≥1 jornada) é responsabilidade da
    // Application, que consulta os outros módulos pelos contratos antes de chamar isto.
    public void Submit()
    {
        if (Status != BusinessStatus.Draft)
        {
            throw new DomainException("business.cannot_submit_from_current_status");
        }

        Status = BusinessStatus.PendingReview;
    }

    public void Approve()
    {
        if (Status != BusinessStatus.PendingReview)
        {
            throw new DomainException("business.cannot_approve_from_current_status");
        }

        Status = BusinessStatus.Active;
    }

    public void ReturnToDraft()
    {
        if (Status != BusinessStatus.PendingReview)
        {
            throw new DomainException("business.cannot_return_from_current_status");
        }

        Status = BusinessStatus.Draft;
    }

    public void Suspend()
    {
        if (Status != BusinessStatus.Active)
        {
            throw new DomainException("business.cannot_suspend_from_current_status");
        }

        Status = BusinessStatus.Suspended;
    }

    public void Reactivate()
    {
        if (Status != BusinessStatus.Suspended)
        {
            throw new DomainException("business.cannot_reactivate_from_current_status");
        }

        Status = BusinessStatus.Active;
    }

    // --- Selo de verificação (independente do ciclo de vida) ---
    public void StartVerificationReview()
    {
        if (VerificationLevel is VerificationLevel.Verified)
        {
            throw new DomainException("business.already_verified");
        }

        VerificationLevel = VerificationLevel.UnderReview;
    }

    public void Verify(Guid adminUserId, string? note, DateTimeOffset now)
    {
        VerificationLevel = VerificationLevel.Verified;
        VerifiedByUserId = adminUserId;
        VerifiedAt = now;
        VerificationNote = note;
    }

    public void RejectVerification(Guid adminUserId, string note, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(note))
        {
            throw new DomainException("business.verification_rejection_requires_note");
        }

        VerificationLevel = VerificationLevel.Rejected;
        VerifiedByUserId = adminUserId;
        VerifiedAt = now;
        VerificationNote = note;
    }

    // --- Localização: palpite do geocodificador vs. confirmação do dono ---
    public void Geocode(GeoPoint point, LocationPrecision precision, string source, DateTimeOffset now)
    {
        Location = point;
        LocationPrecision = precision;
        LocationSource = source;
        GeocodedAt = now;
        LocationConfirmedAt = null;
    }

    // Precisão vem de fora: se o dono só aceitou o palpite sem arrastar o pino, a precisão
    // continua a do geocodificador, não sobe para Rooftop automaticamente.
    public void ConfirmLocation(GeoPoint point, LocationPrecision precision, DateTimeOffset now)
    {
        if (GeocodedAt is null)
        {
            throw new DomainException("business.location_not_geocoded");
        }

        Location = point;
        LocationPrecision = precision;
        LocationConfirmedAt = now;
    }

    public bool IsBookable => Status == BusinessStatus.Active;

    /// <summary>Troca (ou remove, com nulo) o logotipo. Devolve a referência anterior, para apagar os arquivos velhos.</summary>
    public string? ReplaceLogo(string? key)
    {
        string? previous = LogoImageKey;
        LogoImageKey = key is null ? null : ImageKey.Ensure(key);
        return previous;
    }

    /// <summary>Troca (ou remove, com nulo) a capa. Devolve a referência anterior.</summary>
    public string? ReplaceCover(string? key)
    {
        string? previous = CoverImageKey;
        CoverImageKey = key is null ? null : ImageKey.Ensure(key);
        return previous;
    }
}
