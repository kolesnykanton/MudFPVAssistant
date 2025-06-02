namespace MudFPVAssistant.Models.DataSources;

public class FlightDataFactory
{
    private readonly CloudFlightDataSource _cloud;

    public FlightDataFactory(CloudFlightDataSource cloud) => _cloud = cloud;

    public IFlightDataSource Get() => _cloud;
}
