using System.ComponentModel;
using Microsoft.JSInterop;

namespace MudFPVAssistant.Services.Firebase;

public record UserInfo(string Uid, string Email, string DisplayName);

public sealed class FirebaseAuthService
{
    private readonly IJSRuntime _js;
    public FirebaseAuthService(IJSRuntime js) => _js = js;

    public async ValueTask<UserInfo?> SignInAsync()
    {
        try
        {
            return await _js.InvokeAsync<UserInfo?>("signInWithGoogle");
        }
        catch (JSException ex)
        {
            // User closed the popup or auth failed; return null so UI can handle gracefully.
            if (ex.Message.Contains("auth/popup-closed-by-user", StringComparison.OrdinalIgnoreCase) ||
                ex.Message.Contains("popup-closed-by-user", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            throw;
        }
    }

    public ValueTask SignOutAsync() => _js.InvokeVoidAsync("signOutUser");
    public ValueTask<UserInfo?> GetCurrentAsync() => _js.InvokeAsync<UserInfo?>("getCurrentUser");

    // Підписка на зміни стану (наприклад, щоб оновлювати UI)
    public ValueTask SubscribeAsync(DotNetObjectReference<AuthState> obj) =>
        _js.InvokeVoidAsync("subscribeAuthState", obj);
}

public class AuthState : INotifyPropertyChanged
{
    public string? Uid { get; private set; }
    
    [JSInvokable]
    public Task OnAuthStateChanged(string? uid)
    {
        Uid = uid;
        PropertyChanged?.Invoke(this, new(nameof(Uid)));
        return Task.CompletedTask;
    }

    public event PropertyChangedEventHandler? PropertyChanged;
}