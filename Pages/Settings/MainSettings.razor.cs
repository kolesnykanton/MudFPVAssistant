using Microsoft.AspNetCore.Components;

namespace MudFPVAssistant.Pages.Settings;

public partial class MainSettings : ComponentBase
{
    private string _apiKeyGoogleMaps;
    private string _apiKeyOpenWeather;
    protected override async Task OnInitializedAsync()
    {
        await ApiKeysReactiveUserCollectionService.InitializeAsync();
        ApiKeysReactiveUserCollectionService.OnUpdated += Refresh;
        _apiKeyGoogleMaps = ApiKeysReactiveUserCollectionService.Items[0].GoogleApiKey ?? string.Empty;
        _apiKeyOpenWeather = ApiKeysReactiveUserCollectionService.Items[0].OpenWeatherApiKey ?? string.Empty;
    }
    private void Refresh()
        => InvokeAsync(StateHasChanged);
    public void Dispose()
    {
        ApiKeysReactiveUserCollectionService.OnUpdated -= Refresh;
    }
}
