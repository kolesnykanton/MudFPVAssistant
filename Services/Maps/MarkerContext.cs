using MudFPVAssistant.Models;

namespace MudFPVAssistant.Services.Maps;

public class MarkerContext
{
    public FlightSpot Spot { get; set; } = default!;
    public Microsoft.AspNetCore.Components.Web.MouseEventArgs MouseEvent { get; set; } = default!;
}