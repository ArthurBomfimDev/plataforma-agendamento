using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Booking.Application.Common.Media;
using Booking.Arguments.Common;
using Booking.Arguments.Module.People;
using Booking.Arguments.Module.Tenancy;
using Booking.Domain.Entity.Base;
using Booking.IntegrationTests.Infrastructure;
using SkiaSharp;

namespace Booking.IntegrationTests.Media;

/// <summary>
/// Onda 6D: envio de imagem contra a API real, com o processamento real (SkiaSharp) e o armazenamento em memória.
/// O servidor de arquivos em disco tem o seu teste (P10), numa instância com a pasta temporária de verdade.
/// </summary>
[Collection(IntegrationCollection.Name)]
public sealed class ImageTests(IntegrationFixture fixture)
{
    private readonly TestWorld _world = new(fixture);

    private InMemoryFileStorage Files => fixture.Factory.Files;

    [Fact]
    public async Task P1_owner_uploads_a_logo_stored_as_three_webp_files_and_shown_in_public_and_search()
    {
        TestLocation here = TestLocation.Isolated();
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], location: here);

        BusinessDetailResponse detail = await UploadOkAsync<BusinessDetailResponse>(
            "/api/businesses/current/logo", TestImages.Png(900, 600), "logo.png", "image/png", business.OwnerToken);

        ImageSetResponse logo = Assert.IsType<ImageSetResponse>(detail.Logo);
        Assert.Null(detail.Cover);
        string key = KeyOf(logo);
        Assert.StartsWith($"businesses/{business.Id:N}/", key);

        IReadOnlyList<string> paths = Files.PathsOf(key);
        Assert.Equal([$"{key}-l.webp", $"{key}-m.webp", $"{key}-s.webp"], paths);
        Assert.All(paths, p => Assert.Equal(ImageFormat.Webp, ImageSignature.Detect(Files.Files[p].Content)));
        Assert.All(paths, p => Assert.Equal("image/webp", Files.Files[p].ContentType));
        Assert.Equal((160, 107), SizeOf(Files.Files[$"{key}-s.webp"].Content));
        Assert.Equal((640, 427), SizeOf(Files.Files[$"{key}-m.webp"].Content));
        // Nunca aumenta: o original tem 900 de lado.
        Assert.Equal((900, 600), SizeOf(Files.Files[$"{key}-l.webp"].Content));

        PublicBusinessResponse shown = await _world.Client.GetFromJsonAsync<PublicBusinessResponse>(
            $"/api/businesses/{business.Id}", TestWorld.Json) ?? throw new InvalidOperationException();
        Assert.Equal(logo, shown.Logo);

        PagedResult<BusinessSearchItemResponse> found = (await _world.Client.GetFromJsonAsync<PagedResult<BusinessSearchItemResponse>>(
            FormattableString.Invariant($"/api/businesses/search?latitude={here.Latitude}&longitude={here.Longitude}&radiusKm=1"),
            TestWorld.Json))!;
        Assert.Equal(logo, Assert.Single(found.Items).Logo);
    }

    [Fact]
    public async Task P2_replacing_the_cover_deletes_the_old_files_and_removing_clears_it()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], approve: false);

        string first = KeyOf((await UploadOkAsync<BusinessDetailResponse>(
            "/api/businesses/current/cover", TestImages.Jpeg(400, 200), "a.jpg", "image/jpeg", business.OwnerToken)).Cover!);
        string second = KeyOf((await UploadOkAsync<BusinessDetailResponse>(
            "/api/businesses/current/cover", TestImages.Jpeg(400, 200), "a.jpg", "image/jpeg", business.OwnerToken)).Cover!);

        Assert.NotEqual(first, second);
        Assert.Empty(Files.PathsOf(first));
        Assert.Equal(3, Files.PathsOf(second).Count);

        BusinessDetailResponse removed = await _world.SendOkAsync<BusinessDetailResponse>(
            HttpMethod.Delete, "/api/businesses/current/cover", null, business.OwnerToken);
        Assert.Null(removed.Cover);
        Assert.Empty(Files.PathsOf(second));
    }

    [Theory]
    [InlineData("programa.jpg", "image/jpeg", "MZ")]                                    // executável renomeado
    [InlineData("logo.svg", "image/svg+xml", "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>")]
    [InlineData("foto.png", "image/png", "GIF89a")]                                      // formato fora da lista
    public async Task P3_type_is_checked_by_content_not_by_name_or_header(string fileName, string contentType, string start)
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], approve: false);
        int before = Files.Files.Count;
        byte[] content = [.. Encoding.ASCII.GetBytes(start), .. new byte[2048]];

        using HttpResponseMessage response = await UploadAsync("/api/businesses/current/logo", content, fileName, contentType, business.OwnerToken);

        Assert.Equal(HttpStatusCode.UnsupportedMediaType, response.StatusCode);
        Assert.Equal("image.unsupported_type", await TestWorld.ErrorCodeAsync(response));
        Assert.Equal(before, Files.Files.Count);
    }

    [Fact]
    public async Task P4_more_than_5_mb_is_refused()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], approve: false);
        byte[] content = new byte[ImageStore.MaxBytes + 1];
        TestImages.Jpeg(10, 10).CopyTo(content, 0);

        using HttpResponseMessage response = await UploadAsync("/api/businesses/current/logo", content, "grande.jpg", "image/jpeg", business.OwnerToken);

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
    }

    [Fact]
    public async Task P5_exif_with_gps_is_removed_and_the_orientation_is_applied()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], approve: false);

        // Orientação 6: a câmera gravou de lado; a foto de 200 × 100 deve sair em pé, 100 × 200.
        byte[] photo = TestImages.JpegWithExif(200, 100, orientation: 6);
        Assert.Contains(TestImages.GpsMarker, Encoding.ASCII.GetString(photo));

        string key = KeyOf((await UploadOkAsync<BusinessDetailResponse>(
            "/api/businesses/current/logo", photo, "celular.jpg", "image/jpeg", business.OwnerToken)).Logo!);

        foreach (string path in Files.PathsOf(key))
        {
            byte[] stored = Files.Files[path].Content;
            string text = Encoding.ASCII.GetString(stored);
            Assert.DoesNotContain(TestImages.GpsMarker, text);
            Assert.DoesNotContain("Exif", text);
        }

        Assert.Equal((100, 200), SizeOf(Files.Files[$"{key}-l.webp"].Content));
    }

    [Fact]
    public async Task P6_image_larger_than_the_reading_limit_is_refused_before_decoding()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], approve: false);

        using HttpResponseMessage response = await UploadAsync(
            "/api/businesses/current/logo", TestImages.Png(6001, 8), "faixa.png", "image/png", business.OwnerToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("image.dimensions_too_large", await TestWorld.ErrorCodeAsync(response));
    }

    [Fact]
    public async Task P7_professional_photo_by_owner_or_self_other_staff_is_403_other_business_is_404()
    {
        TestBusiness business = await _world.NewBusinessAsync(2, [new ServiceSpec(30)]);
        TestBusiness other = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], approve: false);
        TestUser staff = await _world.NewStaffAsync(business, professionalIndex: 0);
        Guid mine = business.ProfessionalIds[0];
        Guid colleague = business.ProfessionalIds[1];

        ProfessionalResponse self = await UploadOkAsync<ProfessionalResponse>(
            $"/api/businesses/current/professionals/{mine}/photo", TestImages.Jpeg(300, 300), "eu.jpg", "image/jpeg", staff.Token);
        Assert.NotNull(self.Photo);

        await UploadOkAsync<ProfessionalResponse>(
            $"/api/businesses/current/professionals/{colleague}/photo", TestImages.Jpeg(300, 300), "f.jpg", "image/jpeg", business.OwnerToken);

        using (HttpResponseMessage notMine = await UploadAsync(
            $"/api/businesses/current/professionals/{colleague}/photo", TestImages.Jpeg(50, 50), "f.jpg", "image/jpeg", staff.Token))
        {
            Assert.Equal(HttpStatusCode.Forbidden, notMine.StatusCode);
        }

        using HttpResponseMessage crossTenant = await UploadAsync(
            $"/api/businesses/current/professionals/{mine}/photo", TestImages.Jpeg(50, 50), "f.jpg", "image/jpeg", other.OwnerToken);
        Assert.Equal(HttpStatusCode.NotFound, crossTenant.StatusCode);
    }

    [Fact]
    public async Task P8_public_route_hides_the_professional_photo_without_consent_and_full_profile()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)]);
        TestUser staff = await _world.NewStaffAsync(business, professionalIndex: 0);
        Guid professionalId = business.ProfessionalIds[0];

        await UploadOkAsync<ProfessionalResponse>(
            $"/api/businesses/current/professionals/{professionalId}/photo", TestImages.Jpeg(300, 300), "eu.jpg", "image/jpeg", staff.Token);

        Assert.Null((await PublicProfessionalAsync(business, professionalId)).Photo);

        await _world.SendOkAsync(HttpMethod.Put, $"/api/businesses/current/professionals/{professionalId}/public-profile-consent", null, staff.Token);
        await _world.SendOkAsync(HttpMethod.Put, $"/api/businesses/current/professionals/{professionalId}",
            new UpdateProfessionalRequest("Profissional 1", null, null, IsActive: true, ShowFullProfile: true), business.OwnerToken);

        Assert.NotNull((await PublicProfessionalAsync(business, professionalId)).Photo);
    }

    [Fact]
    public async Task P9_without_login_is_401()
    {
        using HttpResponseMessage response = await UploadAsync("/api/businesses/current/logo", TestImages.Png(10, 10), "a.png", "image/png", token: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task P10_media_is_served_from_disk_as_immutable_webp_and_nothing_else()
    {
        TestBusiness business = await _world.NewBusinessAsync(1, [new ServiceSpec(30)], approve: false);

        // Outra instância, com o disco de verdade numa pasta temporária, que aceita os tokens da compartilhada.
        await using var factory = new BookingApiFactory(
            fixture.ConnectionString,
            settings: new Dictionary<string, string> { ["Jwt:SigningKey"] = fixture.Factory.SigningKey },
            useDiskStorage: true);
        using HttpClient client = factory.CreateClient();

        using var upload = Multipart(TestImages.Png(300, 200), "logo.png", "image/png");
        using HttpRequestMessage put = TestWorld.Build(HttpMethod.Put, "/api/businesses/current/logo", null, business.OwnerToken);
        put.Content = upload;
        using HttpResponseMessage stored = await client.SendAsync(put);
        await TestWorld.EnsureStatusAsync(stored, HttpStatusCode.OK);
        ImageSetResponse logo = (await stored.Content.ReadFromJsonAsync<BusinessDetailResponse>(TestWorld.Json))!.Logo!;

        using HttpResponseMessage served = await client.GetAsync(logo.Medium);
        Assert.Equal(HttpStatusCode.OK, served.StatusCode);
        Assert.Equal("image/webp", served.Content.Headers.ContentType?.MediaType);
        Assert.Contains("immutable", served.Headers.CacheControl?.ToString());
        Assert.Equal(TimeSpan.FromDays(365), served.Headers.CacheControl?.MaxAge);
        Assert.Equal("nosniff", served.Headers.GetValues("X-Content-Type-Options").First());
        Assert.True(File.Exists(Path.Combine(factory.MediaRoot, logo.Medium["/media/".Length..])));

        File.WriteAllText(Path.Combine(factory.MediaRoot, "nota.txt"), "não é imagem");
        foreach (string path in new[] { "/media/nota.txt", "/media/../appsettings.json", "/media/%2e%2e/appsettings.json" })
        {
            using HttpResponseMessage refused = await client.GetAsync(path);
            Assert.Equal(HttpStatusCode.NotFound, refused.StatusCode);
        }
    }

    // --- Ajudantes ---

    private async Task<PublicProfessionalResponse> PublicProfessionalAsync(TestBusiness business, Guid professionalId)
    {
        PagedResult<PublicProfessionalResponse> list = (await _world.Client.GetFromJsonAsync<PagedResult<PublicProfessionalResponse>>(
            $"/api/businesses/{business.Id}/professionals", TestWorld.Json))!;
        return list.Items.Single(p => p.Id == professionalId);
    }

    private async Task<T> UploadOkAsync<T>(string path, byte[] content, string fileName, string contentType, string token)
    {
        using HttpResponseMessage response = await UploadAsync(path, content, fileName, contentType, token);
        await TestWorld.EnsureStatusAsync(response, HttpStatusCode.OK);
        return (await response.Content.ReadFromJsonAsync<T>(TestWorld.Json))!;
    }

    private Task<HttpResponseMessage> UploadAsync(string path, byte[] content, string fileName, string contentType, string? token)
    {
        HttpRequestMessage request = TestWorld.Build(HttpMethod.Put, path, null, token);
        request.Content = Multipart(content, fileName, contentType);
        return _world.Client.SendAsync(request);
    }

    private static MultipartFormDataContent Multipart(byte[] content, string fileName, string contentType)
    {
        var file = new ByteArrayContent(content);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { file, "file", fileName } };
    }

    /// <summary>A referência a partir da URL: <c>/media/{key}-m.webp</c>.</summary>
    private static string KeyOf(ImageSetResponse image) => image.Medium["/media/".Length..^"-m.webp".Length];

    private static (int Width, int Height) SizeOf(byte[] webp)
    {
        using SKCodec codec = SKCodec.Create(new MemoryStream(webp));
        return (codec.Info.Width, codec.Info.Height);
    }
}
