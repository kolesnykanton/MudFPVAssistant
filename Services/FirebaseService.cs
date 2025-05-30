using Microsoft.JSInterop;

namespace MudFPVAssistant.Services;

public class FirebaseService(IJSRuntime js)
{
    public async Task AddDocumentAsync<T>(string collection, T data)
        => await js.InvokeVoidAsync("addDocument", collection, data);

    public async Task<List<T>> GetDocumentsAsync<T>(string collection)
        => (await js.InvokeAsync<T[]>("getDocuments", collection)).ToList();

    public async Task UpdateDocumentAsync<T>(string collection, string id, T data)
        => await js.InvokeVoidAsync("updateDocument", collection, id, data);

    public async Task DeleteDocumentAsync(string collection, string id)
        => await js.InvokeVoidAsync("deleteDocument", collection, id);
}
