using System.Net;
using backend.Controllers;
using backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace backend.Tests;

public sealed class WeatherControllerTests
{
    [Fact]
    public async Task Get_ReturnsWeatherFromProviderWithoutReturningProviderCredentials()
    {
        var handler = new StubHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"main":{"temp":18.5},"weather":[{"description":"light rain"}]}""")
            });
        var controller = CreateController(handler, includeApiKey: true);

        var result = await controller.Get(60.1699, 24.9384);

        var response = Assert.IsType<OkObjectResult>(result.Result);
        var body = Assert.IsType<ApiResponse<WeatherController.WeatherDto>>(response.Value);
        Assert.Equal(18.5, body.Data!.Temperature);
        Assert.Equal("light rain", body.Data.Description);
        Assert.Contains("api.openweathermap.org", handler.RequestUri!.Host);
    }

    [Fact]
    public async Task Get_RejectsOutOfRangeCoordinates()
    {
        var controller = CreateController(new StubHttpMessageHandler(_ =>
            throw new InvalidOperationException("Provider must not be called for invalid coordinates.")), includeApiKey: true);

        var result = await controller.Get(91, 24);

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Get_ReportsMissingBackendApiKey()
    {
        var controller = CreateController(new StubHttpMessageHandler(_ =>
            throw new InvalidOperationException("Provider must not be called without configuration.")), includeApiKey: false);

        var result = await controller.Get(60.1699, 24.9384);

        var response = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, response.StatusCode);
    }

    private static WeatherController CreateController(
        HttpMessageHandler handler,
        bool includeApiKey)
    {
        var settings = includeApiKey
            ? new Dictionary<string, string?> { ["Weather:ApiKey"] = "test-weather-key" }
            : new Dictionary<string, string?>();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        return new WeatherController(new StubHttpClientFactory(handler), configuration);
    }

    private sealed class StubHttpClientFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name = "")
            => new(handler, disposeHandler: false);
    }

    private sealed class StubHttpMessageHandler(
        Func<HttpRequestMessage, HttpResponseMessage> responseFactory) : HttpMessageHandler
    {
        public Uri? RequestUri { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestUri = request.RequestUri;
            return Task.FromResult(responseFactory(request));
        }
    }
}
