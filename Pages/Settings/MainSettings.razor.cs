using Microsoft.AspNetCore.Components;

namespace MudFPVAssistant.Pages.Settings;

public partial class MainSettings : ComponentBase
{
    private string _apiKeyGoogleMaps;
    private string _apiKeyOpenWeather;
    protected override async Task OnInitializedAsync()
    {
        await ApiKeysDataSource.InitializeAsync();
        ApiKeysDataSource.OnUpdated += Refresh;
    }
    private void Refresh()
        => InvokeAsync(StateHasChanged);
    public void Dispose()
    {
        ApiKeysDataSource.OnUpdated -= Refresh;
    }
}
