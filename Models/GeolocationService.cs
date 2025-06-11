namespace MudFPVAssistant.Models;
using Microsoft.JSInterop;
public class GeolocationService
{
    private readonly IJSRuntime _js;

    public GeolocationService(IJSRuntime js)
    {
        _js = js;
    }
    /// <summary>
    /// Gets the user's current latitude and longitude from the browser.
    /// </summary>
    public async Task<(double Lat, double Lon)> GetCoordinatesAsync()
    {
        var coords = await _js.InvokeAsync<GeolocationCoords>("getUserLocation");
        return (coords.Latitude, coords.Longitude);
    }
}

public class GeolocationCoords
{
    public double Latitude  { get; set; }
    public double Longitude { get; set; }
}