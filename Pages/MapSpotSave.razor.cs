using System.Text.Json;
using LeafletForBlazor;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using MudBlazor;
using MudFPVAssistant.Models;

namespace MudFPVAssistant.Pages;

public partial class MapSpotSave : ComponentBase
{
    private RealTimeMap rtm;
    private ElementReference mapContainerRef;
    private bool menuMapOpen;
    private bool menuPointOpen;
    private double menuX, menuY;
    private double clickLat, clickLng;

    private RealTimeMap.LoadParameters parameters = new()
    {
        location = new RealTimeMap.Location { latitude = 40.4168, longitude = -3.7038 },
        zoomLevel = 13,
        basemap = new RealTimeMap.Basemap
        {
            basemapLayers = new List<RealTimeMap.BasemapLayer>
            {
                new RealTimeMap.BasemapLayer
                {
                    url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    attribution = "© OpenStreetMap contributors",
                    title = "OSM",
                    detectRetina = true
                }
            }
        }
    };

    // Викликається, коли карта завантажилася
    private async Task OnMapLoaded(RealTimeMap.MapEventArgs args)
    {
        rtm = args.sender;

        await JS.InvokeVoidAsync("registerContextMenu",
            mapContainerRef,
            DotNetObjectReference.Create(this));
        await AutoLocate();
    }

    private async Task AutoLocate()
    {
        try
        {
            var pos = await JS.InvokeAsync<GeolocationPosition>("getCurrentPosition");
            var lat = pos.coords.latitude;
            var lng = pos.coords.longitude;

            parameters.location = new RealTimeMap.Location { latitude = lat, longitude = lng };
            parameters.zoomLevel = 13;

            rtm.Geometric.Points.add(new RealTimeMap.StreamPoint
            {
                guid = Guid.NewGuid(),
                timestamp = DateTime.UtcNow,
                latitude = lat,
                longitude = lng,
                type = "Я тут",
                value = "Ви тут"
            });

            StateHasChanged();
        }
        catch
        {
        }
    }

    private async Task HandleClick(RealTimeMap.ClicksMapArgs args)
    {
        var lat = args.location.latitude;
        var lng = args.location.longitude;
        var name = await JS.InvokeAsync<string>("prompt", "Назва споту:");

        if (!string.IsNullOrWhiteSpace(name))
        {
            rtm.Geometric.Points.add(new RealTimeMap.StreamPoint
            {
                guid = Guid.NewGuid(),
                timestamp = DateTime.UtcNow,
                latitude = lat,
                longitude = lng,
                type = "FPV spot",
                value = name
            });
            StateHasChanged();
        }
    }

    [JSInvokable]
    public Task OnContextMenu(JsonElement args)
    {
        menuX = args.GetProperty("x").GetDouble();
        menuY = args.GetProperty("y").GetDouble();
        // clickLat = args.GetProperty("lat").GetDouble();
        // clickLng = args.GetProperty("lng").GetDouble();
        var isPoint = args.GetProperty("isPoint").GetBoolean();

        menuMapOpen = !isPoint;
        menuPointOpen = isPoint;
        StateHasChanged();
        return Task.CompletedTask;
    }

    private void AddGlobalSpot()
    {
        menuMapOpen = false;
        // тут відкрити MudDialog для введення details зі змінними clickLat/clickLng
    }

    private void EditSpot()
    {
        menuPointOpen = false;
        // знайти StreamPoint за clickLat/clickLng, відкрити MudDialog
    }

    private void DeleteSpot()
    {
        menuPointOpen = false;
        // видалити StreamPoint із rtm.Geometric.Points
    }
}