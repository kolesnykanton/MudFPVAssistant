namespace MudFPVAssistant.Models;

public class FlightInfo
{
    public string Id { get; set; }
    public string? Name { get; set; }
    public int? UsedMah { get; set; }
    public DateTime? Date { get; set; } = DateTime.Today;
    public string? Comment { get; set; }
    public string Location { get; set; }
    public TimeSpan? FlightTime { get; set; }
    public BatteryType BatType { get; set; }
    public BatteryCellCount CellCount { get; set; }

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
        LiIom
    }

    public enum BatteryCellCount
    {
        _1S = 1,
        _2S = 2,
        _3S = 3,
        _4S = 4,
        _5S = 5,
        _6S = 6,
    }
}