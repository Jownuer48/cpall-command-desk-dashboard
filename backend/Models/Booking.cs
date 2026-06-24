namespace Cpall.CommandCenter.Api.Models;

public sealed record Booking(
    string SeatId,
    string BookedBy,
    string Department,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    string Purpose,
    string Note,
    DateTimeOffset UpdatedAt);
