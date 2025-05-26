namespace MudFPVAssistant.Models;

public class GeolocationPosition
{
    public GeolocationCoords coords { get; set; }
}

public class GeolocationCoords
{
    public double Latitude  { get; set; }
    public double Longitude { get; set; }
}