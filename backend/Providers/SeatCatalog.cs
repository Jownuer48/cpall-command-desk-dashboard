using Cpall.CommandCenter.Api.Models;

namespace Cpall.CommandCenter.Api.Providers;

internal static class SeatCatalog
{
    public static readonly IReadOnlyList<Seat> Seats =
    [
        new("S01", "Command Center", "โต๊ะบัญชาการ S01", true),
        new("S02", "Command Center", "โต๊ะบัญชาการ S02", true),
        new("S03", "Command Center", "โต๊ะบัญชาการ S03", true),
        new("S04", "Command Center", "โต๊ะบัญชาการ S04", true),
        new("S05", "Command Center", "โต๊ะบัญชาการ S05", true),
        new("S06", "Command Center", "โต๊ะบัญชาการ S06", false),
        new("S07", "Command Center", "โต๊ะบัญชาการ S07", true),
        new("S08", "Command Center", "โต๊ะบัญชาการ S08", true),
        new("S09", "Command Center", "โต๊ะบัญชาการ S09", true),
        new("S10", "Command Center", "โต๊ะบัญชาการ S10", true),
        new("S11", "Command Center", "โต๊ะบัญชาการ S11", true),
        new("S12", "Command Center", "โต๊ะบัญชาการ S12", false)
    ];

    public static int GetSeatNumber(string seatId)
    {
        var digits = new string(seatId.Where(char.IsDigit).ToArray());
        return int.TryParse(digits, out var value) ? value : int.MaxValue;
    }
}
