using System.ComponentModel;
using System.Security.Claims;
using Microsoft.AspNetCore.Components.Authorization;

namespace MudFPVAssistant.Services.Firebase;

public class FirebaseAuthenticationStateProvider : AuthenticationStateProvider
{
    private readonly AuthState _auth;

    public FirebaseAuthenticationStateProvider(AuthState auth)
    {
        _auth = auth;
        // Підписуємося на PropertyChanged AuthState
        _auth.PropertyChanged += AuthState_PropertyChanged;
    }

    private void AuthState_PropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        // Коли змінився Uid (або інший ключовий стан), повідомляємо Blazor
        NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
    }

    public override Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        ClaimsIdentity identity;
        if (!string.IsNullOrEmpty(_auth.Uid))
        {
            // Створюємо ClaimsIdentity на основі Uid.
            identity = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, _auth.Uid),
                new Claim(ClaimTypes.Name, _auth.Uid)
            }, authenticationType: "FirebaseAuth");
        }
        else
        {
            // Порожній identity означає «анонімний»
            identity = new ClaimsIdentity();
        }

        var user = new ClaimsPrincipal(identity);
        return Task.FromResult(new AuthenticationState(user));
    }
}