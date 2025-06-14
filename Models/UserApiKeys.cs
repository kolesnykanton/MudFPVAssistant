using System.Text.Json.Serialization;

namespace MudFPVAssistant.Models;

public class UserSettings
{
    [JsonPropertyName("id")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Id { get; set; }
    public UserApiKeys ApiKeys { get; set; } = new();
}

public class UserApiKeys
{
    public string? OpenWeatherApiKey { get; set; }
    public string? GoogleApiKey { get; set; }
    public string? WeatherApiKey { get; set; }
}