using System.ComponentModel;
using Microsoft.JSInterop;

namespace MudFPVAssistant.Services;

public record UserInfo(string Uid, string Email, string DisplayName);

public sealed class FirebaseAuthService
{
    private readonly IJSRuntime _js;
    public FirebaseAuthService(IJSRuntime js) => _js = js;

    public ValueTask<UserInfo?> SignInAsync()       => _js.InvokeAsync<UserInfo?>("signInWithGoogle");
    public ValueTask SignOutAsync()                 => _js.InvokeVoidAsync(   "signOutUser");
    public ValueTask<UserInfo?> GetCurrentAsync()   => _js.InvokeAsync<UserInfo?>("getCurrentUser");

    // Підписка на зміни стану (наприклад, щоб оновлювати UI)
    public ValueTask SubscribeAsync(DotNetObjectReference<AuthState> obj) =>
        _js.InvokeVoidAsync("subscribeAuthState", obj);
}

public class AuthState : INotifyPropertyChanged
{
    public string? Uid { get; private set; }
    public bool IsAuthChecked { get; private set; }

    public void Initialize(string? uid)
    {
        Uid = uid;
        IsAuthChecked = true;
        PropertyChanged?.Invoke(this, new(nameof(Uid)));
        PropertyChanged?.Invoke(this, new(nameof(IsAuthChecked)));
    }

    [JSInvokable] public Task OnAuthStateChanged(string? uid)
    {
        Uid = uid;
        PropertyChanged?.Invoke(this, new(nameof(Uid)));
        return Task.CompletedTask;
    }
    public event PropertyChangedEventHandler? PropertyChanged;
}
