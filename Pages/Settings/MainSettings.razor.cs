using Microsoft.AspNetCore.Components;
using MudFPVAssistant.Models;

namespace MudFPVAssistant.Pages.Settings;

public partial class MainSettings : ComponentBase
{
    private string _docId = string.Empty;
    
    private string _openWeatherApiKey = string.Empty;
    private string _googleMapsApiKey  = string.Empty;

    protected override async Task OnInitializedAsync()
    {
        // Підпишемося, щоб ловити зовнішні оновлення
        SettingsService.OnSettingsChanged += RefreshFields;
        await SettingsService.EnsureLoadedAsync();
        RefreshFields();
    }

    private void RefreshFields()
    {
        var s = SettingsService.Current;
        _openWeatherApiKey = s.ApiKeys.OpenWeatherApiKey;
        _googleMapsApiKey  = s.ApiKeys.GoogleApiKey;
        InvokeAsync(StateHasChanged);
    }

    private async Task SaveApiKeys()
    {
        var s = SettingsService.Current;
        s.ApiKeys.OpenWeatherApiKey = _openWeatherApiKey;
        s.ApiKeys.GoogleApiKey  = _googleMapsApiKey;
        await SettingsService.UpdateAsync(s);
    }

    public void Dispose()
        => SettingsService.OnSettingsChanged -= RefreshFields;
}
