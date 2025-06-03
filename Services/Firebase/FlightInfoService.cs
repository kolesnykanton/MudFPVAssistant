using Microsoft.JSInterop;
using MudFPVAssistant.Models;

namespace MudFPVAssistant.Services.Firebase;

public sealed class FlightInfoService
{
    private readonly IJSRuntime _js;
    private readonly AuthState _auth;
    public FlightInfoService(IJSRuntime js, AuthState auth)
    {
        _js = js; _auth = auth;
    }

    private string Uid => _auth.Uid!
                          ?? throw new InvalidOperationException("User is not authenticated");

    public ValueTask AddAsync(FlightInfo fi) =>
        _js.InvokeVoidAsync("addUserDoc", Uid, "FlightInfos", fi);

    public ValueTask<List<FlightInfo>> GetAsync() =>
        _js.InvokeAsync<List<FlightInfo>>("getUserDocs", Uid, "FlightInfos");

    public ValueTask UpdateAsync(string id, FlightInfo fi) =>
        _js.InvokeVoidAsync("updateUserDoc", Uid, "FlightInfos", id, fi);

    public ValueTask DeleteAsync(string id) =>
        _js.InvokeVoidAsync("deleteUserDoc", Uid, "FlightInfos", id);
}
