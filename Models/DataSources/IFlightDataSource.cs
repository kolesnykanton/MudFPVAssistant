namespace MudFPVAssistant.Models.DataSources;

public interface IFlightDataSource
{
    IReadOnlyList<FlightInfo> Items { get; }
    event Action OnUpdated;

    Task InitializeAsync();
    Task AddAsync(FlightInfo flight);
    Task DeleteAsync(string id);
    Task UpdateAsync(string id, FlightInfo flight);
}
