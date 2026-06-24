namespace Cpall.CommandCenter.Api.Models;

public sealed record Booking(
    string SeatId,
    string BookedBy,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    string Purpose);
