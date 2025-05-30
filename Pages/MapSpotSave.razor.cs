using System.Text.Json;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using MudBlazor;
using MudFPVAssistant.Models;

namespace MudFPVAssistant.Pages;

public partial class MapSpotSave : ComponentBase
{
    private MudMenu? _mapMenu;
    private MudMenu? _markerMenu;
    private double clickLat, clickLng;
    private DotNetObjectReference<MapSpotSave> dotnetRef;
    private List<FlightSpot> spots = new();
    private FlightSpot? selectedSpot;
    private bool editDialogOpen = false;

    private const string StorageKey = "fpvSpots";

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            dotnetRef = DotNetObjectReference.Create(this);
            await JS.InvokeVoidAsync("fpvinitializeMap", "fpvMap", dotnetRef);
            spots = await LocalStorage.GetItemAsync<List<FlightSpot>>(StorageKey) ?? [];
            foreach (var s in spots)
                await JS.InvokeVoidAsync("fpvAddMarker", s);
            
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
    public async Task OnContextMenu(JsonElement args)
    {
        var x = args.GetProperty("x").GetInt32();
        var y = args.GetProperty("y").GetInt32();
        clickLat = args.GetProperty("lat").GetDouble();
        clickLng = args.GetProperty("lng").GetDouble();
        var isPoint = args.GetProperty("isPoint").GetBoolean();
        var evt = new MouseEventArgs
        {
            ClientX = args.GetProperty("x").GetInt32(),
            ClientY = args.GetProperty("y").GetInt32(),
            PageX = args.GetProperty("x").GetInt32(),
            PageY = args.GetProperty("y").GetInt32()
        };


        if (isPoint)
        {
            var anb = args.GetProperty("id").ToString();
            var id = args.GetProperty("id").GetGuid();
            selectedSpot = spots.FirstOrDefault(s => s.Id == id);
            if (selectedSpot is not null)
                await _markerMenu.OpenMenuAsync(evt);
        }
        else
        {
            await _mapMenu.OpenMenuAsync(evt);
        }

        StateHasChanged();
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
        await _mapMenu.CloseMenuAsync();

        var newSpot = new FlightSpot
        {
            Latitude = clickLat,
            Longitude = clickLng
        };

        var parameters = new DialogParameters<FlightSpotEditDialog>
        {
            { x => x.Spot, newSpot }
        };
        var options = new DialogOptions
        {
            MaxWidth = MaxWidth.Large, // Встановлює максимальну ширину
            FullWidth = true // Діалог розтягується на всю доступну ширину до MaxWidth
        };
        var dialog = await DialogService.ShowAsync<FlightSpotEditDialog>("Новий спот", parameters, options);
        var result = await dialog.Result;

        if (!result.Canceled && result.Data is FlightSpot confirmed)
        {
            spots.Add(confirmed);
            await SaveAndRender();
        }
    }
    
    private async Task DeleteSpot()
    {
        if (selectedSpot is null) return;
        spots.RemoveAll(s => s.Id == selectedSpot.Id);
        await SaveAndRender();
        selectedSpot = null;
        await _markerMenu.CloseMenuAsync();
    }

    private async Task OpenEditDialog()
    {
        if (selectedSpot is null) return;

        var parameters = new DialogParameters<FlightSpotEditDialog> { { x => x.Spot, selectedSpot } };
        var dialog = await DialogService.ShowAsync<FlightSpotEditDialog>("Редагування спота", parameters);
        var result = await dialog.Result;

        if (!result.Canceled && result.Data is FlightSpot updated)
        {
            var existing = spots.FirstOrDefault(s => s.Id == updated.Id);
            if (existing != null)
            {
                existing.Name = updated.Name;
                existing.Comments = updated.Comments;
                await SaveAndRender();
            }
        }
    }
    private async Task SaveAndRender()
    {
        await LocalStorage.SetItemAsync(StorageKey, spots);
        await JS.InvokeVoidAsync("fpvClearMarkers");
        foreach (var s in spots)
            await JS.InvokeVoidAsync("fpvAddMarker", s);
    }
}