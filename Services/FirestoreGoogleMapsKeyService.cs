using GoogleMapsComponents;
using GoogleMapsComponents.Maps;

namespace MudFPVAssistant.Services;

public class FirestoreGoogleMapsKeyService : IBlazorGoogleMapsKeyService
{
    private readonly AppSettingsService _settings;

    public FirestoreGoogleMapsKeyService(AppSettingsService settings)
    {
        _settings = settings;
    }

    public async ValueTask<string> GetApiKeyAsync()
    {
        // Переконаємося, що налаштування завантажені
        await _settings.EnsureLoadedAsync();
        // Повернемо ключ із Firestore
        return _settings.Current.ApiKeys.GoogleApiKey;
    }

    public Task<MapApiLoadOptions> GetApiOptions()
    {
        throw new NotImplementedException();
    }

    public bool IsApiInitialized { get; set; }
}