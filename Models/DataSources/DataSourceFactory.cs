namespace MudFPVAssistant.Models.DataSources;

public class DataSourceFactory
{
    private readonly IServiceProvider _provider;

    public DataSourceFactory(IServiceProvider provider)
    {
        _provider = provider;
    }

    public IDataSource<T> Get<T>() where T : class
    {
        var service = _provider.GetService<IDataSource<T>>();
        if (service is null)
            throw new InvalidOperationException($"No registered IDataSource<{typeof(T).Name}>");

        return service;
    }
}
