using Blazored.LocalStorage;
using GoogleMapsComponents;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using MudBlazor;
using MudFPVAssistant;
using MudBlazor.Services;
using MudFPVAssistant.Models;
using MudFPVAssistant.Models.DataSources;
using MudFPVAssistant.Services;


var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped<FlightInfoService>();
builder.Services.AddScoped<FirebaseAuthService>();
builder.Services.AddScoped<AuthenticationStateProvider, FirebaseAuthenticationStateProvider>();

builder.Services.AddScoped<IUserDocumentService, UserDocumentService>();
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

builder.Services.AddScoped<CloudFlightDataSource>();
builder.Services.AddScoped<FlightDataFactory>();

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

await builder.Build().RunAsync();