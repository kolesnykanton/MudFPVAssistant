using Blazored.LocalStorage;
using GoogleMapsComponents;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.JSInterop;
using MudBlazor;
using MudFPVAssistant;
using MudBlazor.Services;
using MudFPVAssistant.Models;
using MudFPVAssistant.Models.DataSources;
using MudFPVAssistant.Services;


var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// 1. Авторизація
builder.Services.AddScoped<AuthState>();
builder.Services.AddScoped<AuthenticationStateProvider, FirebaseAuthenticationStateProvider>();
builder.Services.AddScoped<FirebaseAuthService>();
builder.Services.AddAuthorizationCore();

// 2. Базовий Firestore-сервіс
builder.Services.AddScoped<IUserDocumentService, UserDocumentService>();

// 3. ReactiveUserCollectionService з collectionName
builder.Services.AddScoped<ReactiveUserCollectionService<FlightInfo>>(sp =>
    new ReactiveUserCollectionService<FlightInfo>(
        sp.GetRequiredService<IUserDocumentService>(),
        sp.GetRequiredService<AuthenticationStateProvider>(),
        "FlightInfos"));
builder.Services.AddScoped<ReactiveUserCollectionService<FlightSpot>>(sp =>
    new ReactiveUserCollectionService<FlightSpot>(
        sp.GetRequiredService<IUserDocumentService>(),
        sp.GetRequiredService<AuthenticationStateProvider>(),
        "FlightSpots"));

// 4. Firebase Storage для фото
builder.Services.AddScoped<IFirebaseStorageService, FirebaseStorageService>();

// 5. CloudDataSource як реалізації IDataSource<T>
builder.Services.AddScoped<IDataSource<FlightInfo>, CloudFlightDataSource>();
builder.Services.AddScoped<IDataSource<FlightSpot>, CloudSpotDataSource>();

// 6. Фабрика для отримання IDataSource<T>
builder.Services.AddScoped<DataSourceFactory>();

builder.Services.AddScoped<CloudFlightDataSource>();
builder.Services.AddScoped<DataSourceFactory>();

builder.Services.AddAuthorizationCore();
builder.Services.AddScoped<AuthState>();

builder.Services.AddMudServices(cfg =>
{
    cfg.SnackbarConfiguration.PositionClass = Defaults.Classes.Position.BottomLeft;
    cfg.SnackbarConfiguration.VisibleStateDuration = 2000;
});
builder.Services.AddBlazoredLocalStorage();
builder.Services.AddBlazorGoogleMaps("AIzaSyA_Lhy8SbBeA7zyuveu2ocNKQCzfUlslaI");
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

var host = builder.Build();

var js = host.Services.GetRequiredService<IJSRuntime>();
var module = await js.InvokeAsync<IJSObjectReference>("import", "./js/firebaseInterop.js");

if (builder.HostEnvironment.IsDevelopment())
{
    // 1. Підключаємо емулятори
    await module.InvokeVoidAsync("connectEmulators");
    // 2. Потім вмикаємо кеш
    await module.InvokeVoidAsync("enableOfflinePersistence");
}
else
{
    // Production: одразу вмикаємо кеш, без емуляторів
    await module.InvokeVoidAsync("enableOfflinePersistence");
}


await host.RunAsync();