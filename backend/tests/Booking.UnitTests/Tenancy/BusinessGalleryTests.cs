using Booking.Domain.Entity.Module.Tenancy;
using Booking.Domain.Enum.Module.Tenancy;
using Booking.Domain.Exceptions;
using Booking.Domain.ValueObject;

namespace Booking.UnitTests.Tenancy;

/// <summary>
/// Vitrine do estabelecimento (B2): até 3 fotos, a primeira é a capa. A galeria é sempre compacta — sem buraco entre fotos —,
/// então "a primeira" nunca fica vazia com foto depois dela.
/// </summary>
public sealed class BusinessGalleryTests
{
    private static Business NewBusiness() =>
        Business.Create("Studio", Document.Of("11.222.333/0001-81"), BusinessCategory.Beleza);

    [Fact]
    public void A_new_business_has_no_photos()
    {
        Assert.Empty(NewBusiness().GalleryImageKeys);
    }

    [Fact]
    public void Photos_are_added_in_order_and_the_first_is_the_cover()
    {
        Business business = NewBusiness();

        Assert.Null(business.SetGalleryPhoto(0, "businesses/a/1"));
        Assert.Null(business.SetGalleryPhoto(1, "businesses/a/2"));
        Assert.Null(business.SetGalleryPhoto(2, "businesses/a/3"));

        Assert.Equal(["businesses/a/1", "businesses/a/2", "businesses/a/3"], business.GalleryImageKeys);
        Assert.Equal("businesses/a/1", business.CoverImageKey);
    }

    [Fact]
    public void A_slot_past_the_end_appends_instead_of_leaving_a_gap()
    {
        Business business = NewBusiness();

        business.SetGalleryPhoto(2, "businesses/a/1");

        Assert.Equal(["businesses/a/1"], business.GalleryImageKeys);
        Assert.Equal("businesses/a/1", business.CoverImageKey);
    }

    [Fact]
    public void Replacing_returns_the_previous_key_so_the_files_can_be_deleted()
    {
        Business business = NewBusiness();
        business.SetGalleryPhoto(0, "businesses/a/1");
        business.SetGalleryPhoto(1, "businesses/a/2");

        string? previous = business.SetGalleryPhoto(1, "businesses/a/9");

        Assert.Equal("businesses/a/2", previous);
        Assert.Equal(["businesses/a/1", "businesses/a/9"], business.GalleryImageKeys);
    }

    [Fact]
    public void A_fourth_photo_is_refused_when_the_gallery_is_full_and_the_slot_is_outside_it()
    {
        Business business = NewBusiness();
        business.SetGalleryPhoto(0, "businesses/a/1");
        business.SetGalleryPhoto(1, "businesses/a/2");
        business.SetGalleryPhoto(2, "businesses/a/3");

        Assert.Equal("business.photo_slot_invalid", Assert.Throws<DomainException>(() => business.SetGalleryPhoto(3, "businesses/a/4")).Code);
        Assert.Equal("business.photo_slot_invalid", Assert.Throws<DomainException>(() => business.SetGalleryPhoto(-1, "businesses/a/4")).Code);
    }

    [Fact]
    public void Removing_compacts_the_gallery_and_the_next_photo_becomes_the_cover()
    {
        Business business = NewBusiness();
        business.SetGalleryPhoto(0, "businesses/a/1");
        business.SetGalleryPhoto(1, "businesses/a/2");
        business.SetGalleryPhoto(2, "businesses/a/3");

        string? removed = business.RemoveGalleryPhoto(0);

        Assert.Equal("businesses/a/1", removed);
        Assert.Equal(["businesses/a/2", "businesses/a/3"], business.GalleryImageKeys);
        Assert.Equal("businesses/a/2", business.CoverImageKey);
    }

    [Fact]
    public void Removing_an_empty_slot_is_not_found()
    {
        Business business = NewBusiness();
        business.SetGalleryPhoto(0, "businesses/a/1");

        Assert.Equal("business_photo.not_found", Assert.Throws<DomainException>(() => business.RemoveGalleryPhoto(1)).Code);
    }

    [Fact]
    public void Reordering_applies_a_permutation_and_a_new_first_photo_becomes_the_cover()
    {
        Business business = NewBusiness();
        business.SetGalleryPhoto(0, "businesses/a/1");
        business.SetGalleryPhoto(1, "businesses/a/2");
        business.SetGalleryPhoto(2, "businesses/a/3");

        business.ReorderGallery([2, 0, 1]);

        Assert.Equal(["businesses/a/3", "businesses/a/1", "businesses/a/2"], business.GalleryImageKeys);
        Assert.Equal("businesses/a/3", business.CoverImageKey);
    }

    [Theory]
    [InlineData(new[] { 0, 0, 1 })]
    [InlineData(new[] { 0, 1 })]
    [InlineData(new[] { 0, 1, 3 })]
    [InlineData(new int[0])]
    public void Reordering_with_anything_but_a_permutation_is_refused(int[] order)
    {
        Business business = NewBusiness();
        business.SetGalleryPhoto(0, "businesses/a/1");
        business.SetGalleryPhoto(1, "businesses/a/2");
        business.SetGalleryPhoto(2, "businesses/a/3");

        Assert.Equal("business.photo_order_invalid", Assert.Throws<DomainException>(() => business.ReorderGallery(order)).Code);
        Assert.Equal(["businesses/a/1", "businesses/a/2", "businesses/a/3"], business.GalleryImageKeys);
    }

    [Fact]
    public void The_old_cover_operations_still_work_as_the_first_slot()
    {
        Business business = NewBusiness();
        business.SetGalleryPhoto(0, "businesses/a/1");
        business.SetGalleryPhoto(1, "businesses/a/2");

        string? previous = business.ReplaceCover("businesses/a/9");
        Assert.Equal("businesses/a/1", previous);
        Assert.Equal(["businesses/a/9", "businesses/a/2"], business.GalleryImageKeys);

        // Remover a capa promove a foto seguinte, em vez de deixar a vitrine sem primeira foto.
        Assert.Equal("businesses/a/9", business.ReplaceCover(null));
        Assert.Equal(["businesses/a/2"], business.GalleryImageKeys);
        Assert.Equal("businesses/a/2", business.CoverImageKey);
    }

    [Fact]
    public void A_cover_on_an_empty_gallery_becomes_its_first_photo()
    {
        Business business = NewBusiness();

        Assert.Null(business.ReplaceCover("businesses/a/1"));

        Assert.Equal(["businesses/a/1"], business.GalleryImageKeys);
    }
}
