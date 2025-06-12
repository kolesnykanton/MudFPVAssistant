using Blazor.WeatherWidget;
using Blazor.WeatherWidget.Settings;
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
using MudFPVAssistant.Services;
using MudFPVAssistant.Services.DataSources;
using MudFPVAssistant.Services.Firebase;


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

builder.Services.AddScoped<ReactiveUserCollectionService<FlightSpot>>(sp =>
    new ReactiveUserCollectionService<FlightSpot>(
        sp.GetRequiredService<IUserDocumentService>(),
        sp.GetRequiredService<AuthenticationStateProvider>(),
        "ApiKeys"));
// 4. Firebase Storage для фото
builder.Services.AddScoped<IFirebaseStorageService, FirebaseStorageService>();

// 5. CloudDataSource як реалізації IDataSource<T>
builder.Services.AddScoped<IDataSource<FlightInfo>, CloudFlightDataSource>();
builder.Services.AddScoped<IDataSource<FlightSpot>, CloudSpotDataSource>();

// 6. Фабрика для отримання IDataSource<T>
builder.Services.AddScoped<DataSourceFactory>();
/*
builder.Services.AddScoped<CloudFlightDataSource>();
*/

// 1. Задаємо значення в ServiceCollection
builder.Services.Configure<WeatherWidgetSettings>(opt =>
{
    opt.OpenWeatherApiKey = "cb9057bc695e65c32bd8ad9081faba9b";
});
// 2. Далі прив’язуємо все, як звичайно
builder.Services.AddWeatherWidgetServices(builder.Configuration);

builder.Services.AddMudServices(cfg =>
{
    cfg.SnackbarConfiguration.PositionClass = Defaults.Classes.Position.BottomLeft;
    cfg.SnackbarConfiguration.VisibleStateDuration = 2000;
});
builder.Services.AddBlazoredLocalStorage();
builder.Services.AddBlazorGoogleMaps("AIzaSyA_Lhy8SbBeA7zyuveu2ocNKQCzfUlslaI");
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

var host = builder.Build();

var js = host.Services.GetRequiredService<IJSRuntime>();
var module = await js.InvokeAsync<IJSObjectReference>("import", "./js/firebase/firebaseInterop.js");

if (builder.HostEnvironment.IsDevelopment())
{
    await module.InvokeVoidAsync("connectEmulators");
    await module.InvokeVoidAsync("enableOfflinePersistence");
}
else
{
    await module.InvokeVoidAsync("enableOfflinePersistence");
}


await host.RunAsync();