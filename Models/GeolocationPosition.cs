namespace MudFPVAssistant.Models;

public class GeolocationPosition
{
    public GeolocationCoords coords { get; set; }
}

public class GeolocationCoords
{
    public double latitude  { get; set; }
    public double longitude { get; set; }
}