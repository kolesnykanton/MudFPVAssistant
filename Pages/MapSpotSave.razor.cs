using System.Text.Json;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.JSInterop;
using MudBlazor;
using MudFPVAssistant.Components;
using MudFPVAssistant.Models;

namespace MudFPVAssistant.Pages;

public partial class MapSpotSave : ComponentBase
{
    private MudMenu? _mapMenu;
    private MudMenu? _markerMenu;
    private DotNetObjectReference<MapSpotSave>? dotnetRef;
    private FlightSpot? selectedSpot;
    private double clickLat, clickLng;

    protected override async Task OnInitializedAsync()
    {
        // Підписка на оновлення кешу, щоб одразу перемалювати маркери
        SpotsService.OnUpdated += async () =>
        {
            await RenderMarkersAsync();
            StateHasChanged();
        };
        await SpotsService.InitializeAsync();
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            dotnetRef = DotNetObjectReference.Create(this);
            await JS.InvokeVoidAsync("fpvinitializeMap", "fpvMap", dotnetRef);
            await RenderMarkersAsync();
        }
    }

    private async Task RenderMarkersAsync()
    {
        await JS.InvokeVoidAsync("fpvClearMarkers");
        foreach (var spot in SpotsService.Items)
        {
            await JS.InvokeVoidAsync("fpvAddMarker", spot);
        }
    }

    [JSInvokable]
    public async Task HandleClick(double lat, double lng)
    {
        clickLat = lat;
        clickLng = lng;
        await AddGlobalSpot();
    }

    [JSInvokable]
    public async Task OnContextMenu(JsonElement args)
    {
        int x = args.GetProperty("x").GetInt32();
        int y = args.GetProperty("y").GetInt32();
        clickLat = args.GetProperty("lat").GetDouble();
        clickLng = args.GetProperty("lng").GetDouble();
        bool isPoint = args.GetProperty("isPoint").GetBoolean();

        var evt = new MouseEventArgs
        {
            ClientX = x,
            ClientY = y,
            PageX = x,
            PageY = y
        };

        if (isPoint && args.TryGetProperty("id", out var idEl))
        {
            var id = idEl.GetString();
            if (!string.IsNullOrEmpty(id))
            {
                selectedSpot = SpotsService.Items.FirstOrDefault(s => s.Id == id);
                if (selectedSpot is not null)
                {
                    await _markerMenu!.OpenMenuAsync(evt);
                    return;
                }
            }
        }

        await _mapMenu!.OpenMenuAsync(evt);
    }

    private async Task AddGlobalSpot()
    {
        await _mapMenu!.CloseMenuAsync();

        // Створюємо новий FlightSpot з Id = null (JsonIgnore викине це поле)
        var newSpot = new FlightSpot
        {
            Latitude = clickLat,
            Longitude = clickLng,
            Name = "",
            Comments = null,
            Category = null,
            Tags = new List<string>()
        };

        var parameters = new DialogParameters<FlightSpotEditDialog>
        {
            { x => x.Spot, newSpot }
        };
        var options = new DialogOptions
        {
            MaxWidth = MaxWidth.Large,
            FullWidth = true
        };
        var dialog = await DialogService.ShowAsync<FlightSpotEditDialog>("Новий спот", parameters, options);
        var result = await dialog.Result;

        if (!result.Canceled && result.Data is FlightSpot confirmed)
        {
            // Викликаємо сервіс додавання: AddAsync поверне та присвоїть Id
            await SpotsService.AddAsync(confirmed);
            // Після цього SpotsService.OnUpdated спрацює → RenderMarkersAsync намалює маркер
        }
    }

    private async Task DeleteSpot()
    {
        if (selectedSpot is null || string.IsNullOrEmpty(selectedSpot.Id))
            return;

        await _markerMenu!.CloseMenuAsync();
        await SpotsService.DeleteAsync(selectedSpot.Id);
        selectedSpot = null;
    }

    private async Task OpenEditDialog()
    {
        if (selectedSpot is null)
            return;

        var parameters = new DialogParameters<FlightSpotEditDialog>
        {
            { x => x.Spot, selectedSpot }
        };
        var dialog = await DialogService.ShowAsync<FlightSpotEditDialog>("Редагування спота", parameters);
        var result = await dialog.Result;

        if (!result.Canceled && result.Data is FlightSpot updated)
        {
            await SpotsService.UpdateAsync(updated.Id!, updated);
        }
    }

    /*[JSInvokable]
    public Task AutoLocated(double lat, double lng)
    {
        // централізуєте карту чи додаєте маркер “Я тут”
        StateHasChanged();
        return Task.CompletedTask;
    }*/

    public void Dispose()
    {
        SpotsService.OnUpdated -= async () =>
        {
            await RenderMarkersAsync();
            StateHasChanged();
        };
    }
}