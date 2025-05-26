using MudBlazor; // для Converter<,>
using System.Globalization;
using MudFPVAssistant.Models; // для CultureInfo


namespace MudFPVAssistant.Converters
{
    public class CoordinateConverter : MudBlazor.Converter<GeolocationCoords, string>
    {
        public CoordinateConverter()
        {
            Culture = CultureInfo.InvariantCulture;
            SetFunc = c => $"{c.Latitude:F6}, {c.Longitude:F6}";
            GetFunc = str =>
            {
                var p = str.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim()).ToArray();
                if (p.Length == 2
                    && double.TryParse(p[0], NumberStyles.Float, Culture, out var lat)
                    && double.TryParse(p[1], NumberStyles.Float, Culture, out var lon))
                {
                    return new GeolocationCoords { Latitude = lat, Longitude = lon };
                }
                return new GeolocationCoords();
            };
        }
    }
}