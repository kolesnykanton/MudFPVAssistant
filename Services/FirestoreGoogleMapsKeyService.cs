using GoogleMapsComponents;
using GoogleMapsComponents.Maps;

namespace MudFPVAssistant.Services;

public class FirestoreGoogleMapsKeyService(AppSettingsService settings) : IBlazorGoogleMapsKeyService
{
    public async Task<MapApiLoadOptions> GetApiOptions()
    {
        
        await settings.EnsureLoadedAsync();
        
        if (string.IsNullOrEmpty(settings.Current.ApiKeys.GoogleApiKey))
        {
            IsApiInitialized = false;
            throw new Exception("Google Maps API Key is missing.");
        }

        IsApiInitialized = true;
        return new MapApiLoadOptions(settings.Current.ApiKeys.GoogleApiKey);
    }

    public bool IsApiInitialized { get; set; }
}