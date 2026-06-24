namespace Cpall.CommandCenter.Api.Models;

public sealed record DeskStatusDto(
    string SeatId,
    string Zone,
    string ComputerName,
    string Status,
    bool IsActive,
    DateTimeOffset? StartTime,
    DateTimeOffset? EndTime,
    string? BookedBy,
    string? Department,
    string? Purpose,
    string? Note,
    DateTimeOffset UpdatedAt);
