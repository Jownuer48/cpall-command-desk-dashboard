namespace Cpall.CommandCenter.Api.Models;

public sealed record Seat(
    string SeatId,
    string Zone,
    string ComputerName,
    bool IsActive);
