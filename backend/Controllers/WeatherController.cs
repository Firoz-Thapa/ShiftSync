using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class WeatherController : ControllerBase
{
    private const double DefaultLatitude = 60.1699;
    private const double DefaultLongitude = 24.9384;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public WeatherController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<WeatherDto>>> Get(
        [FromQuery] double latitude = DefaultLatitude,
        [FromQuery] double longitude = DefaultLongitude,
        CancellationToken cancellationToken = default)
    {
        if (!double.IsFinite(latitude) || latitude is < -90 or > 90 ||
            !double.IsFinite(longitude) || longitude is < -180 or > 180)
        {
            return BadRequest(ApiResponse<WeatherDto>.Fail("A valid latitude and longitude are required."));
        }

        var apiKey = _configuration["Weather:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                ApiResponse<WeatherDto>.Fail("Weather service is not configured."));
        }

        var url = "https://api.openweathermap.org/data/2.5/weather" +
                  $"?lat={latitude.ToString(CultureInfo.InvariantCulture)}" +
                  $"&lon={longitude.ToString(CultureInfo.InvariantCulture)}" +
                  $"&appid={Uri.EscapeDataString(apiKey)}&units=metric";

        using var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);

        try
        {
            using var response = await client.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    ApiResponse<WeatherDto>.Fail("Weather provider returned an error."));
            }

            var providerData = await response.Content.ReadFromJsonAsync<OpenWeatherResponse>(
                cancellationToken: cancellationToken);
            if (providerData?.Main is null || providerData.Weather is not { Count: > 0 } ||
                string.IsNullOrWhiteSpace(providerData.Weather[0].Description))
            {
                return StatusCode(
                    StatusCodes.Status502BadGateway,
                    ApiResponse<WeatherDto>.Fail("Weather provider returned an invalid response."));
            }

            return Ok(ApiResponse<WeatherDto>.Ok(
                new WeatherDto(providerData.Main.Temperature, providerData.Weather[0].Description)));
        }
        catch (HttpRequestException)
        {
            return StatusCode(
                StatusCodes.Status502BadGateway,
                ApiResponse<WeatherDto>.Fail("Unable to reach the weather provider."));
        }
        catch (JsonException)
        {
            return StatusCode(
                StatusCodes.Status502BadGateway,
                ApiResponse<WeatherDto>.Fail("Weather provider returned an invalid response."));
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(
                StatusCodes.Status504GatewayTimeout,
                ApiResponse<WeatherDto>.Fail("Weather provider request timed out."));
        }
    }

    public sealed record WeatherDto(double Temperature, string Description);

    private sealed class OpenWeatherResponse
    {
        [JsonPropertyName("main")]
        public OpenWeatherMain? Main { get; set; }

        [JsonPropertyName("weather")]
        public List<OpenWeatherCondition>? Weather { get; set; }
    }

    private sealed class OpenWeatherMain
    {
        [JsonPropertyName("temp")]
        public double Temperature { get; set; }
    }

    private sealed class OpenWeatherCondition
    {
        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
    }
}
