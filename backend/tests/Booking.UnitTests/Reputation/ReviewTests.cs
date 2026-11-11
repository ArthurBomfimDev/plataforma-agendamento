using Booking.Application.Common.Persistence;
using Booking.Application.Common.Tenancy;
using Booking.Application.Contracts.Identity;
using Booking.Application.Contracts.People;
using Booking.Application.Contracts.Scheduling;
using Booking.Application.Contracts.Tenancy;
using Booking.Application.Module.Reputation.Commands;
using Booking.Application.Module.Reputation.Queries;
using Booking.Arguments.Module.Reputation;
using Booking.Domain.Entity.Base;
using Booking.Domain.Entity.Module.Reputation;
using Booking.Domain.Enum.Module.Reputation;
using Booking.Domain.Exceptions;
using Booking.Domain.Interface.Repository.Module.Reputation;

namespace Booking.UnitTests.Reputation;

public sealed class ReviewTests
{
    private static readonly DateTimeOffset _completedAt = new(2026, 11, 1, 15, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Customer_reviews_a_completed_appointment_and_the_summary_is_updated_in_the_same_save()
    {
        World w = new();

        MyReviewResponse created = await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, 4, "  Ótimo  "));

        Assert.Equal(5, created.Rating);
        Assert.Equal("Ótimo", created.Comment);
        Assert.True(created.CanEdit);
        Assert.Equal(1, w.Unit.Saves);
        Assert.Equal(1, w.Summary(RatingTarget.Business, w.BusinessId)!.Count);
        Assert.Equal(1, w.Summary(RatingTarget.Professional, w.ProfessionalId)!.Count);
    }

    [Fact]
    public async Task Review_without_professional_rating_does_not_touch_the_professional_summary()
    {
        World w = new();

        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(4, null, null));

        Assert.Null(w.Summary(RatingTarget.Professional, w.ProfessionalId));
    }

    [Fact]
    public async Task Average_is_hidden_until_three_reviews_then_shown()
    {
        RatingSummary summary = RatingSummary.Create(Guid.NewGuid(), RatingTarget.Business, Guid.NewGuid());

        summary.Add(5);
        summary.Add(4);
        Assert.Null(summary.Average);
        Assert.False(summary.HasAverage);

        summary.Add(3);
        Assert.Equal(4.0, summary.Average);
        Assert.Equal([0, 0, 1, 1, 1], summary.Distribution);
    }

    [Fact]
    public async Task Appointment_of_another_customer_answers_as_not_found()
    {
        World w = new() { AppointmentCustomerId = Guid.NewGuid() };

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null)));

        Assert.Equal("review.not_found", error.Code);
        Assert.Empty(w.Reviews.All);
    }

    [Fact]
    public async Task Unknown_appointment_answers_as_not_found()
    {
        World w = new();

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => w.Create().ExecuteAsync(Guid.NewGuid(), new SaveReviewRequest(5, null, null)));

        Assert.Equal("review.not_found", error.Code);
    }

    [Fact]
    public async Task Panel_token_cannot_review()
    {
        World w = new() { ActorBusinessId = Guid.NewGuid() };

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null)));

        Assert.Equal("appointment.customer_context_required", error.Code);
    }

    [Fact]
    public async Task Member_of_the_business_cannot_review_it()
    {
        World w = new() { UserIsMember = true };

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null)));

        Assert.Equal("review.not_allowed", error.Code);
    }

    [Fact]
    public async Task Appointment_not_completed_cannot_be_reviewed()
    {
        World w = new() { Completed = false };

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null)));

        Assert.Equal("review.not_completed", error.Code);
    }

    [Fact]
    public async Task Window_closes_thirty_days_after_completion()
    {
        World inside = new() { Now = _completedAt.AddDays(30) };
        await inside.Create().ExecuteAsync(inside.AppointmentId, new SaveReviewRequest(5, null, null));

        World outside = new() { Now = _completedAt.AddDays(30).AddMinutes(1) };
        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => outside.Create().ExecuteAsync(outside.AppointmentId, new SaveReviewRequest(5, null, null)));

        Assert.Equal("review.window_expired", error.Code);
    }

    [Fact]
    public async Task Second_review_of_the_same_appointment_is_refused()
    {
        World w = new();
        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null));

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(1, null, null)));

        Assert.Equal("review.already_reviewed", error.Code);
        Assert.Equal(1, w.Summary(RatingTarget.Business, w.BusinessId)!.Count);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(-1)]
    public async Task Rating_out_of_range_is_refused(int rating)
    {
        World w = new();

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(rating, null, null)));

        Assert.Equal("review.rating_invalid", error.Code);
        Assert.Equal(0, w.Unit.Saves);
    }

    [Fact]
    public async Task Professional_rating_out_of_range_is_refused()
    {
        World w = new();

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, 7, null)));

        Assert.Equal("review.rating_invalid", error.Code);
    }

    [Fact]
    public async Task Comment_over_five_hundred_characters_is_refused_and_five_hundred_is_accepted()
    {
        World ok = new();
        await ok.Create().ExecuteAsync(ok.AppointmentId, new SaveReviewRequest(5, null, new string('a', 500)));

        World tooLong = new();
        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => tooLong.Create().ExecuteAsync(tooLong.AppointmentId, new SaveReviewRequest(5, null, new string('a', 501))));

        Assert.Equal("review.comment_too_long", error.Code);
    }

    [Fact]
    public async Task Health_review_does_not_keep_or_show_the_service()
    {
        World w = new() { Sensitive = true };

        MyReviewResponse created = await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null));

        Assert.Null(created.ServiceName);
        Assert.Null(w.Reviews.All.Single().ServiceName);
    }

    [Fact]
    public async Task Common_review_keeps_the_service_name()
    {
        World w = new();

        MyReviewResponse created = await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null));

        Assert.Equal("Corte", created.ServiceName);
    }

    [Theory]
    [InlineData("Ana Souza Lima", "Ana S.")]
    [InlineData("ana souza", "ana S.")]
    [InlineData("Ana", "Ana")]
    [InlineData("  ", "Consumidor")]
    public void Public_name_is_first_name_and_surname_initial(string full, string expected) =>
        Assert.Equal(expected, Review.DisplayNameOf(full));

    [Fact]
    public async Task Public_review_exposes_only_the_abbreviated_name()
    {
        World w = new() { FullName = "Ana Souza Lima" };

        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, "ok"));

        Review stored = w.Reviews.All.Single();
        Assert.Equal("Ana S.", stored.ReviewerName);
        Assert.DoesNotContain("Souza", stored.ReviewerName);
    }

    [Fact]
    public async Task Social_name_wins_over_the_account_name()
    {
        World w = new() { FullName = "Ana Souza Lima", SocialName = "Alex Pereira" };

        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null));

        Assert.Equal("Alex P.", w.Reviews.All.Single().ReviewerName);
    }

    [Fact]
    public async Task Edit_replaces_the_old_ratings_in_the_summary_instead_of_adding()
    {
        World w = new();
        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, 5, null));
        w.Now = _completedAt.AddDays(2);

        MyReviewResponse edited = await w.Update().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(2, 1, "mudei"));

        Assert.Equal(2, edited.Rating);
        Assert.False(edited.CanEdit);
        RatingSummary business = w.Summary(RatingTarget.Business, w.BusinessId)!;
        Assert.Equal(1, business.Count);
        Assert.Equal(2, business.Sum);
        Assert.Equal([0, 1, 0, 0, 0], business.Distribution);
        RatingSummary professional = w.Summary(RatingTarget.Professional, w.ProfessionalId)!;
        Assert.Equal(1, professional.Count);
        Assert.Equal(1, professional.Sum);
    }

    [Fact]
    public async Task Edit_that_adds_a_professional_rating_enters_the_professional_summary_once()
    {
        World w = new();
        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(4, null, null));

        await w.Update().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(4, 3, null));

        Assert.Equal(1, w.Summary(RatingTarget.Professional, w.ProfessionalId)!.Count);
        Assert.Equal(1, w.Summary(RatingTarget.Business, w.BusinessId)!.Count);
    }

    [Fact]
    public async Task Edit_that_removes_the_professional_rating_takes_it_out_of_the_summary()
    {
        World w = new();
        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(4, 3, null));

        await w.Update().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(4, null, null));

        Assert.Equal(0, w.Summary(RatingTarget.Professional, w.ProfessionalId)!.Count);
    }

    [Fact]
    public async Task Review_can_be_edited_only_once()
    {
        World w = new();
        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null));
        await w.Update().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(4, null, null));

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => w.Update().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(3, null, null)));

        Assert.Equal("review.already_edited", error.Code);
    }

    [Fact]
    public async Task Edit_window_closes_seven_days_after_the_review()
    {
        World w = new();
        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null));
        w.Now = w.Now.AddDays(7).AddMinutes(1);

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => w.Update().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(4, null, null)));

        Assert.Equal("review.edit_window_expired", error.Code);
        Assert.Equal(5, w.Summary(RatingTarget.Business, w.BusinessId)!.Sum);
    }

    [Fact]
    public async Task Edit_of_a_review_from_another_customer_answers_as_not_found()
    {
        World w = new();
        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null));
        w.CustomerId = Guid.NewGuid();

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => w.Update().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(1, null, null)));

        Assert.Equal("review.not_found", error.Code);
    }

    [Fact]
    public async Task Edit_of_a_hidden_review_does_not_change_the_summary()
    {
        World w = new();
        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null));
        w.Reviews.All.Single().Hide(Guid.NewGuid(), "ofensa", w.Now);

        await w.Update().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(1, null, null));

        Assert.Equal(5, w.Summary(RatingTarget.Business, w.BusinessId)!.Sum);
    }

    [Fact]
    public async Task Hide_requires_a_reason_and_records_who_decided()
    {
        World w = new();
        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null));
        Review review = w.Reviews.All.Single();
        Guid admin = Guid.NewGuid();

        Assert.Equal("review.hide_requires_reason", Assert.Throws<DomainException>(() => review.Hide(admin, " ", w.Now)).Code);

        review.Hide(admin, "  ofensa  ", w.Now);
        Assert.True(review.IsHidden);
        Assert.Equal(admin, review.HiddenByUserId);
        Assert.Equal("ofensa", review.HiddenReason);

        review.Unhide(admin, w.Now);
        Assert.False(review.IsHidden);
    }

    [Fact]
    public void Report_needs_a_reason_opens_once_and_hiding_closes_it()
    {
        Review review = Review.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 1, null, "ruim", "Ana S.", null, false, _completedAt);
        Guid owner = Guid.NewGuid();

        Assert.Equal("review.report_reason_invalid", Assert.Throws<DomainException>(() => review.Report(owner, "curt", _completedAt)).Code);

        review.Report(owner, "  Não fui atendida por esta pessoa.  ", _completedAt);
        Assert.True(review.HasOpenReport);
        Assert.Equal("Não fui atendida por esta pessoa.", review.ReportReason);
        Assert.Equal("review.already_reported", Assert.Throws<DomainException>(() => review.Report(owner, "de novo, outra vez", _completedAt)).Code);

        review.Hide(Guid.NewGuid(), "ofensa", _completedAt);
        Assert.False(review.HasOpenReport);
    }

    [Fact]
    public void Dismissing_keeps_the_review_public_and_only_works_with_an_open_report()
    {
        Review review = Review.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 1, null, null, "Ana S.", null, false, _completedAt);

        Assert.Equal("review.no_open_report", Assert.Throws<DomainException>(() => review.DismissReport(_completedAt)).Code);

        review.Report(Guid.NewGuid(), "Motivo da denúncia", _completedAt);
        review.DismissReport(_completedAt);

        Assert.False(review.HasOpenReport);
        Assert.False(review.IsHidden);
    }

    [Fact]
    public async Task Public_rating_of_a_business_without_reviews_is_new()
    {
        World w = new();

        RatingSummaryResponse rating = await new GetBusinessRatingQuery(w.Summaries, w.Businesses).ExecuteAsync(w.BusinessId);

        Assert.True(rating.IsNew);
        Assert.Null(rating.Average);
        Assert.Equal(0, rating.Count);
    }

    [Fact]
    public async Task Public_rating_with_fewer_than_three_reviews_is_still_new_but_counts()
    {
        World w = new();
        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null));

        RatingSummaryResponse rating = await new GetBusinessRatingQuery(w.Summaries, w.Businesses).ExecuteAsync(w.BusinessId);

        Assert.True(rating.IsNew);
        Assert.Null(rating.Average);
        Assert.Equal(1, rating.Count);
    }

    [Fact]
    public async Task Public_rating_rounds_to_one_decimal_from_the_third_review()
    {
        World w = new();
        RatingSummary summary = RatingSummary.Create(w.BusinessId, RatingTarget.Business, w.BusinessId);
        summary.Add(5);
        summary.Add(5);
        summary.Add(4);
        w.Summaries.Add(summary);

        RatingSummaryResponse rating = await new GetBusinessRatingQuery(w.Summaries, w.Businesses).ExecuteAsync(w.BusinessId);

        Assert.False(rating.IsNew);
        Assert.Equal(4.7, rating.Average);
        Assert.Equal(3, rating.Count);
    }

    [Fact]
    public async Task Public_reads_of_an_inactive_business_answer_as_not_found()
    {
        World w = new() { BusinessBookable = false };

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => new GetBusinessRatingQuery(w.Summaries, w.Businesses).ExecuteAsync(w.BusinessId));
        DomainException list = await Assert.ThrowsAsync<DomainException>(
            () => new ListBusinessReviewsQuery(w.Reviews, w.Businesses).ExecuteAsync(w.BusinessId, new PageRequest(1, 10)));

        Assert.Equal("business.not_found", error.Code);
        Assert.Equal("business.not_found", list.Code);
    }

    [Fact]
    public async Task Public_reads_of_an_unknown_professional_answer_as_not_found()
    {
        World w = new();

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => new GetProfessionalRatingQuery(w.Summaries, w.People, w.Businesses).ExecuteAsync(Guid.NewGuid()));

        Assert.Equal("professional.not_found", error.Code);
    }

    [Fact]
    public async Task My_reviews_returns_only_the_customers_own()
    {
        World w = new();
        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null));
        w.Reviews.Add(Review.Create(w.BusinessId, Guid.NewGuid(), w.ProfessionalId, Guid.NewGuid(), 1, null, null, "Outra P.", null, false, w.Now));

        PagedResult<MyReviewResponse> mine = await new ListMyReviewsQuery(w.Reviews, w.People, w.Actor, w.Clock)
            .ExecuteAsync(new PageRequest(1, 20));

        Assert.Single(mine.Items);
        Assert.Equal(5, mine.Items[0].Rating);
    }

    [Fact]
    public async Task Get_my_review_of_another_customer_answers_as_not_found()
    {
        World w = new();
        await w.Create().ExecuteAsync(w.AppointmentId, new SaveReviewRequest(5, null, null));
        w.CustomerId = Guid.NewGuid();

        DomainException error = await Assert.ThrowsAsync<DomainException>(
            () => new GetMyReviewQuery(w.Reviews, w.People, w.Actor, w.Clock).ExecuteAsync(w.AppointmentId));

        Assert.Equal("review.not_found", error.Code);
    }

    private sealed class World
    {
        public Guid UserId { get; } = Guid.NewGuid();

        public Guid CustomerId { get; set; } = Guid.NewGuid();

        public Guid BusinessId { get; } = Guid.NewGuid();

        public Guid ProfessionalId { get; } = Guid.NewGuid();

        public Guid AppointmentId { get; } = Guid.NewGuid();

        public Guid? AppointmentCustomerId { get; set; }

        public Guid? ActorBusinessId { get; set; }

        public bool UserIsMember { get; set; }

        public bool Completed { get; set; } = true;

        public bool Sensitive { get; set; }

        public bool BusinessBookable { get; set; } = true;

        public string FullName { get; set; } = "Ana Souza";

        public string? SocialName { get; set; }

        public DateTimeOffset Now { get; set; } = _completedAt.AddDays(1);

        public FakeReviews Reviews { get; } = new();

        public FakeSummaries Summaries { get; } = new();

        public CountingUnit Unit { get; } = new();

        public FakeClock Clock => new(this);

        public IActorContext Actor => new FakeActor(UserId, ActorBusinessId);

        public IPeopleDirectory People => new FakePeople(this);

        public IBusinessDirectory Businesses => new FakeBusinesses(this);

        public RatingSummary? Summary(RatingTarget target, Guid targetId) => Summaries.All.SingleOrDefault(s => s.Target == target && s.TargetId == targetId);

        public CreateReviewCommand Create() => new(
            Reviews, new FakeAppointments(this), People, new FakeUsers(this), Businesses, new RatingAggregator(Summaries), Actor, Unit, Clock);

        public UpdateReviewCommand Update() => new(Reviews, People, new RatingAggregator(Summaries), Actor, Unit, Clock);
    }

    private sealed class FakeClock(World world) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => world.Now;
    }

    private sealed class FakeActor(Guid userId, Guid? businessId) : IActorContext
    {
        public Guid? UserId => userId;

        public Guid? BusinessId => businessId;

        public string? BusinessRole => null;

        public bool IsPlatformAdmin => false;
    }

    private sealed class CountingUnit : IUnitOfWork
    {
        public int Saves { get; private set; }

        public Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            Saves++;
            return Task.FromResult(1);
        }
    }

    private sealed class FakeReviews : IReviewRepository
    {
        private readonly List<Review> _all = [];

        public IReadOnlyList<Review> All => _all;

        public Task<Review?> GetByAppointmentAsync(Guid appointmentId, CancellationToken ct = default) =>
            Task.FromResult(_all.SingleOrDefault(r => r.AppointmentId == appointmentId));

        public Task<PagedResult<Review>> ListOfBusinessAsync(Guid businessId, PageRequest page, CancellationToken ct = default) =>
            Page(_all.Where(r => r.BusinessId == businessId && !r.IsHidden), page);

        public Task<PagedResult<Review>> ListOfProfessionalAsync(Guid professionalId, PageRequest page, CancellationToken ct = default) =>
            Page(_all.Where(r => r.ProfessionalId == professionalId && !r.IsHidden), page);

        public Task<PagedResult<Review>> ListOfCustomerAsync(Guid customerId, PageRequest page, CancellationToken ct = default) =>
            Page(_all.Where(r => r.CustomerId == customerId), page);

        public Task<Review?> GetByIdAsync(Guid reviewId, CancellationToken ct = default) =>
            Task.FromResult(_all.SingleOrDefault(r => r.Id == reviewId));

        public Task<Review?> GetOfBusinessAsync(Guid businessId, Guid reviewId, CancellationToken ct = default) =>
            Task.FromResult(_all.SingleOrDefault(r => r.Id == reviewId && r.BusinessId == businessId));

        public Task<PagedResult<Review>> ListWithOpenReportAsync(PageRequest page, CancellationToken ct = default) =>
            Page(_all.Where(r => r.HasOpenReport), page);

        public Task<PagedResult<Review>> ListHiddenAsync(PageRequest page, CancellationToken ct = default) =>
            Page(_all.Where(r => r.IsHidden), page);

        public void Add(Review review) => _all.Add(review);

        private static Task<PagedResult<Review>> Page(IEnumerable<Review> source, PageRequest page)
        {
            List<Review> list = [.. source.OrderByDescending(r => r.ReviewedAt)];
            return Task.FromResult(new PagedResult<Review>([.. list.Skip((page.Page - 1) * page.PageSize).Take(page.PageSize)], page.Page, page.PageSize, list.Count));
        }
    }

    private sealed class FakeSummaries : IRatingSummaryRepository
    {
        private readonly List<RatingSummary> _all = [];

        public IReadOnlyList<RatingSummary> All => _all;

        public Task<RatingSummary?> GetAsync(Guid businessId, RatingTarget target, Guid targetId, CancellationToken ct = default) =>
            Task.FromResult(_all.SingleOrDefault(s => s.BusinessId == businessId && s.Target == target && s.TargetId == targetId));

        public void Add(RatingSummary summary) => _all.Add(summary);
    }

    private sealed class FakeAppointments(World world) : IAppointmentReviewLookup
    {
        public Task<AppointmentForReview?> FindAsync(Guid appointmentId, CancellationToken ct = default) =>
            Task.FromResult<AppointmentForReview?>(appointmentId == world.AppointmentId
                ? new AppointmentForReview(
                    world.AppointmentId,
                    world.BusinessId,
                    world.ProfessionalId,
                    world.AppointmentCustomerId ?? world.CustomerId,
                    world.Completed,
                    world.Completed ? _completedAt : null,
                    "Corte",
                    world.Sensitive)
                : null);
    }

    private sealed class FakePeople(World world) : IPeopleDirectory
    {
        public Task<ProfessionalInfo?> GetProfessionalAsync(Guid businessId, Guid professionalId, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<Guid?> FindActiveProfessionalBusinessAsync(Guid professionalId, CancellationToken ct = default) =>
            Task.FromResult<Guid?>(professionalId == world.ProfessionalId ? world.BusinessId : null);

        public Task<int> CountActiveProfessionalsAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<Guid?> FindProfessionalIdByMembershipAsync(Guid businessId, Guid membershipId, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<Guid?> FindCustomerIdAsync(Guid userId, CancellationToken ct = default) =>
            Task.FromResult<Guid?>(userId == world.UserId ? world.CustomerId : null);

        public Task<IReadOnlyList<CustomerIdentity>> GetCustomersAsync(IReadOnlyCollection<Guid> customerIds, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<CustomerIdentity>>([new CustomerIdentity(world.CustomerId, world.UserId, world.SocialName)]);
    }

    private sealed class FakeUsers(World world) : IUserDirectory
    {
        public Task<IReadOnlyDictionary<Guid, string>> GetFullNamesAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyDictionary<Guid, string>>(new Dictionary<Guid, string> { [world.UserId] = world.FullName });

        public Task<IReadOnlyList<UserContact>> GetActiveContactsAsync(IReadOnlyCollection<Guid> userIds, CancellationToken ct = default) =>
            throw new NotSupportedException();
    }

    private sealed class FakeBusinesses(World world) : IBusinessDirectory
    {
        public Task<BusinessContactInfo?> GetContactInfoAsync(Guid businessId, CancellationToken ct = default) => throw new NotSupportedException();

        public Task<IReadOnlyList<Guid>> ListActiveOwnerUserIdsAsync(Guid businessId, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<Guid?> FindActiveMembershipUserIdAsync(Guid businessId, Guid membershipId, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<BusinessMembershipInfo?> FindActiveMembershipAsync(Guid businessId, Guid userId, CancellationToken ct = default) =>
            Task.FromResult<BusinessMembershipInfo?>(world.UserIsMember ? new BusinessMembershipInfo(Guid.NewGuid(), businessId, userId, "Owner") : null);

        public Task<IReadOnlyList<UserBusinessInfo>> ListActiveBusinessesOfUserAsync(Guid userId, int limit, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<BusinessSchedulingInfo?> GetSchedulingInfoAsync(Guid businessId, CancellationToken ct = default) =>
            Task.FromResult<BusinessSchedulingInfo?>(businessId == world.BusinessId
                ? new BusinessSchedulingInfo(businessId, "America/Sao_Paulo", world.BusinessBookable, false, true, 24, 1, 60, 24)
                : null);
    }
}
