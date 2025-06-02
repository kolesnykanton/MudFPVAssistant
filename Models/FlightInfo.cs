using System.Text.Json.Serialization;

namespace MudFPVAssistant.Models;

public class FlightInfo
{
    [JsonPropertyName("id")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Id { get; set; }
    public string? Name { get; set; }
    public int? UsedMah { get; set; }
    public DateTime? Date { get; set; } = DateTime.Today;
    public string? Comment { get; set; }
    public string Location { get; set; }
    public TimeSpan? FlightTime { get; set; }
    public BatteryType BatType { get; set; }
    [JsonPropertyName("cellCount")]
    public int CellCount { get; set; } = 1;

    public FlightInfo()
    {
    }

    public FlightInfo(string name, int usedMah, DateTime? date, string location, string? comment = null)
    {
        Name = name;
        UsedMah = usedMah;
        Date = date;
        Location = location;
        Comment = comment;
    }

    public enum BatteryType
    {
        Unknown,
        LiPo,
        LiIon
    }
}