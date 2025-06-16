using System.Text.Json.Serialization;

namespace MudFPVAssistant.Models;

public class UserSettings
{
    [JsonPropertyName("id")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Id { get; set; }
    public UserApiKeys ApiKeys { get; set; } = new();
}