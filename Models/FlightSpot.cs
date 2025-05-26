namespace MudFPVAssistant.Models;

public class FlightSpot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public GeolocationCoords Coords => 
        new() { Latitude = Latitude, Longitude = Longitude };
    public string Name { get; set; } = "";
    public string? Comments { get; set; }
    public string? Category { get; set; } 
    public List<string> Tags { get; set; } = new();
}