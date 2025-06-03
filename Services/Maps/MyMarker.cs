using GoogleMapsComponents.Maps;
using Microsoft.JSInterop;
using MudFPVAssistant.Models;

namespace MudFPVAssistant.Services.Maps;

public class MyMarker
{
    private readonly Marker _marker;
    public FlightSpot Spot { get; }

    private MyMarker(Marker marker, FlightSpot spot)
    {
        _marker = marker;
        Spot = spot;
    }

    /// <summary>
    /// Створює кастомний маркер і вішає обробник на rightclick (без MouseEventArgs).
    /// </summary>
    /// <param name="js"></param>
    /// <param name="map"></param>
    /// <param name="spot"></param>
    /// <param name="onRightClick">Опціональний обробник (FlightSpot)</param>
    public static async Task<MyMarker> CreateAsync(
        IJSRuntime js,
        Map map,
        FlightSpot spot,
        Func<FlightSpot, Task>? onRightClick = null)
    {
        var marker = await Marker.CreateAsync(js, new MarkerOptions
        {
            Position = new LatLngLiteral
            {
                Lat = spot.Latitude,
                Lng = spot.Longitude
            },
            Map = map,
            Title = spot.Name,
            Clickable = false, // 👉 маркер не ловить кліки
            ZIndex = -1, // 👉 маркер під всіма об'єктами карти (опційно)
            Icon = new Icon
            {
                Url = "img/cda1_drone-green-grey.svg",
                ScaledSize = new Size { Width = 120, Height = 120 }
            }
        });

        if (onRightClick != null)
        {
            // Подія rightclick просто передає спот (без MouseEventArgs)
            await marker.AddListener("rightclick", async () => { await onRightClick(spot); });
        }

        return new MyMarker(marker, spot);
    }
}