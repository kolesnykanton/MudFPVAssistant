using MudFPVAssistant.Services;

namespace MudFPVAssistant.Models.DataSources;

public class CloudFlightDataSource : IDataSource<FlightInfo>, IDisposable
{
    private readonly ReactiveUserCollectionService<FlightInfo> _svc;

    public CloudFlightDataSource(ReactiveUserCollectionService<FlightInfo> svc)
    {
        _svc = svc;
        _svc.OnUpdated += RaiseUpdated;
    }

    public IReadOnlyList<FlightInfo> Items => _svc.Items;
    public event Action? OnUpdated;

    public Task InitializeAsync() => _svc.InitializeAsync();
    public Task AddAsync(FlightInfo f) => _svc.AddAsync(f);
    public Task DeleteAsync(string id) => _svc.DeleteAsync(id);
    public Task UpdateAsync(string id, FlightInfo f) => _svc.UpdateAsync(id, f);

    private void RaiseUpdated() => OnUpdated?.Invoke();
    public void Dispose() => _svc.OnUpdated -= RaiseUpdated;
}