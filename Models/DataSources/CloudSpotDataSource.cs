using MudFPVAssistant.Services;

namespace MudFPVAssistant.Models.DataSources;

public class CloudSpotDataSource : IDataSource<FlightSpot>, IDisposable
{
    private readonly ReactiveUserCollectionService<FlightSpot> _svc;
    private readonly IFirebaseStorageService _storage;
    private readonly AuthState _auth;

    public CloudSpotDataSource(
        ReactiveUserCollectionService<FlightSpot> svc,
        IFirebaseStorageService storage,
        AuthState auth)
    {
        _svc = svc;
        _storage = storage;
        _auth = auth;
        _svc.OnUpdated += RaiseUpdated;
    }

    public IReadOnlyList<FlightSpot> Items => _svc.Items;
    public event Action? OnUpdated;

    public Task InitializeAsync() => _svc.InitializeAsync();

    public async Task AddAsync(FlightSpot spot)
    {
        // 1) Create doc item
        await _svc.AddAsync(spot);

        /*// 2) Upload photo if exists"
        if (spot.PhotoFile is not null)
        {
            var uid = _auth.Uid 
                      ?? throw new InvalidOperationException("User not authenticated");

            var fileName = spot.PhotoFile.Name;
            var storagePath = $"users/{uid}/FlightSpots/{spot.Id}/{fileName}";

            // upload photo and get downloadUrl
            var downloadUrl = await _storage.UploadAsync(storagePath, spot.PhotoFile);
            
            // add PhotoUrl into model
            spot.PhotoUrl = downloadUrl;
            spot.StoragePath = storagePath;

            // 3) Update Firestore with PhotoUrl
            await _svc.UpdateAsync(spot.Id, spot);
            
        }*/
    }

    public async Task DeleteAsync(string id)
    {
        var uid = _auth.Uid 
                  ?? throw new InvalidOperationException("User not authenticated");

        // Знаходимо у кеші spot за id
        var spot = _svc.Items.FirstOrDefault(s => s.Id == id);
        if (!string.IsNullOrEmpty(spot.StoragePath))
        {
            await _storage.DeleteAsync(spot.StoragePath);
        }

        await _svc.DeleteAsync(id);
    }

    public async Task UpdateAsync(string id, FlightSpot spot)
    {
        var uid = _auth.Uid 
                  ?? throw new InvalidOperationException("User not authenticated");

        if (spot.PhotoFile is not null)
        {
            // (1) Спочатку видаляємо старий файл, якщо є StoragePath
            if (!string.IsNullOrEmpty(spot.StoragePath))
            {
                await _storage.DeleteAsync(spot.StoragePath);
            }

            // (2) Завантажуємо новий файл за тими ж правилами
            var fileName = spot.PhotoFile.Name;
            var storagePath = $"users/{uid}/FlightSpots/{id}/{fileName}";
            var downloadUrl = await _storage.UploadAsync(storagePath, spot.PhotoFile);

            spot.StoragePath = storagePath;
            spot.PhotoUrl   = downloadUrl;
        }

        await _svc.UpdateAsync(id, spot);
    }

    private void RaiseUpdated() => OnUpdated?.Invoke();
    public void Dispose() => _svc.OnUpdated -= RaiseUpdated;
}
