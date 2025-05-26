using System.Text.Json;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using MudBlazor;
using MudFPVAssistant.Models;

namespace MudFPVAssistant.Pages;

public partial class MapSpotSave : ComponentBase
{
    private ElementReference mapContainerRef;
    private bool menuMapOpen;
    private bool menuPointOpen;
    private double menuX, menuY;
    private double clickLat, clickLng;
    private DotNetObjectReference<MapSpotSave> dotnetRef;


    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            dotnetRef = DotNetObjectReference.Create(this);
            await JS.InvokeVoidAsync("fpvinitializeMap", "fpvMap", dotnetRef);
        }
    }

    [JSInvokable]
    public async Task HandleClick(double lat, double lng)
    {
        clickLat = lat;
        clickLng = lng;
        await AddGlobalSpot();
        StateHasChanged();
        //return Task.CompletedTask;
    }

    [JSInvokable]
    public Task OnContextMenu(JsonElement args)
    {
        menuX = args.GetProperty("x").GetInt32();
        menuY = args.GetProperty("y").GetInt32();
        clickLat = args.GetProperty("lat").GetDouble();
        clickLng = args.GetProperty("lng").GetDouble();
        var isPoint = args.GetProperty("isPoint").GetBoolean();
        menuMapOpen = !isPoint; // якщо фон — відкриваємо меню для додавання
        menuPointOpen = isPoint; // якщо маркер — меню редагування

        StateHasChanged();
        return Task.CompletedTask;
    }


    [JSInvokable]
    public Task AutoLocated(double lat, double lng)
    {
        // централізуєте карту чи додаєте маркер “Я тут”
        StateHasChanged();
        return Task.CompletedTask;
    }

    private async Task AddGlobalSpot()
    {
        menuMapOpen = false;

        // Назва споту — тимчасово через prompt
        var name = await JS.InvokeAsync<string>("prompt", "Назва споту:");
        if (!string.IsNullOrWhiteSpace(name))
        {
            await JS.InvokeVoidAsync("fpvAddMarker", clickLat, clickLng, $"<b>{name}</b>");
        }

        StateHasChanged();
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