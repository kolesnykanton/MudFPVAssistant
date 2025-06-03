using Microsoft.JSInterop;

namespace MudFPVAssistant.Services.Firebase
{
    public interface IUserDocumentService
    {
        ValueTask<string> AddAsync<T>(string collection, T data);
        ValueTask<List<T>> GetAsync<T>(string collection);
        ValueTask UpdateAsync<T>(string collection, string id, T data);
        ValueTask DeleteAsync(string collection, string id);
    }

    public class UserDocumentService : IUserDocumentService
    {
        private readonly IJSRuntime _js;
        private readonly AuthState  _auth;

        public UserDocumentService(IJSRuntime js, AuthState auth)
        {
            _js   = js;
            _auth = auth;
        }

        private string Uid =>
            _auth.Uid
            ?? throw new InvalidOperationException("User is not authenticated");

        public ValueTask<string> AddAsync<T>(string collection, T data) =>
            _js.InvokeAsync<string>("addUserDoc", _auth.Uid, collection, data);

        public ValueTask<List<T>> GetAsync<T>(string collection) =>
            _js.InvokeAsync<List<T>>("getUserDocs", Uid, collection);

        public ValueTask UpdateAsync<T>(string collection, string id, T data) =>
            _js.InvokeVoidAsync("updateUserDoc", Uid, collection, id, data);

        public ValueTask DeleteAsync(string collection, string id) =>
            _js.InvokeVoidAsync("deleteUserDoc", Uid, collection, id);
    }
}
