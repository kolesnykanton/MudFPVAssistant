using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Components.Forms;

namespace MudFPVAssistant.Models;

public class FlightSpot
{
    [JsonPropertyName("id")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Id { get; set; }
    public string Name { get; set; } = "";
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public GeolocationCoords Coords => 
        new() { Latitude = Latitude, Longitude = Longitude };
    public string? Comments { get; set; }
    public string? Category { get; set; } 
    public List<string> Tags { get; set; } = [];
    public string? PhotoUrl { get; set; }
    public string? StoragePath { get; set; }
    [JsonIgnore]
    public IBrowserFile? PhotoFile { get; set; }
}