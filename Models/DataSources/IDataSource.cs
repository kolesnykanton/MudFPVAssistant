namespace MudFPVAssistant.Models.DataSources;

public interface IDataSource<T>
{
    IReadOnlyList<T> Items { get; }
    event Action OnUpdated;

    Task InitializeAsync();
    Task AddAsync(T item);
    Task DeleteAsync(string id);
    Task UpdateAsync(string id, T item);
}
