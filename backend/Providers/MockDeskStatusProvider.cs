using Cpall.CommandCenter.Api.Models;

namespace Cpall.CommandCenter.Api.Providers;

public sealed class MockDeskStatusProvider : IDeskStatusProvider
{
    private static readonly IReadOnlyList<Seat> Seats =
    [
        new("CC-01", "Command Center A", "Command-A-01", true),
        new("CC-02", "Command Center A", "Command-A-02", true),
        new("CC-03", "Command Center A", "Command-A-03", true),
        new("CC-04", "Command Center A", "Command-A-04", true),
        new("CC-05", "Command Center A", "Command-A-05", true),
        new("CC-06", "Command Center A", "Command-A-06", false),
        new("CC-07", "Command Center B", "Command-B-01", true),
        new("CC-08", "Command Center B", "Command-B-02", true),
        new("CC-09", "Command Center B", "Command-B-03", true),
        new("CC-10", "Command Center B", "Command-B-04", true),
        new("CC-11", "Command Center B", "Command-B-05", true),
        new("CC-12", "Command Center B", "Command-B-06", false),
        new("CC-13", "Monitoring Zone", "Monitor-01", true),
        new("CC-14", "Monitoring Zone", "Monitor-02", true),
        new("CC-15", "Monitoring Zone", "Monitor-03", true),
        new("CC-16", "Monitoring Zone", "Monitor-04", true),
        new("CC-17", "Monitoring Zone", "Monitor-05", true),
        new("CC-18", "Monitoring Zone", "Monitor-06", false),
        new("CC-19", "Supervisor Zone", "Supervisor-01", true),
        new("CC-20", "Supervisor Zone", "Supervisor-02", true),
        new("CC-21", "Supervisor Zone", "Supervisor-03", true),
        new("CC-22", "Supervisor Zone", "Supervisor-04", true),
        new("CC-23", "Supervisor Zone", "Supervisor-05", true),
        new("CC-24", "Supervisor Zone", "Supervisor-06", false)
    ];

    public Task<IReadOnlyList<DeskStatusDto>> GetDeskStatusesAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var bookings = CreateBookings(now);

        var statuses = Seats
            .OrderBy(seat => GetSeatNumber(seat.SeatId))
            .Select(seat => BuildStatus(seat, bookings, now))
            .ToList();

        return Task.FromResult<IReadOnlyList<DeskStatusDto>>(statuses);
    }

    private static DeskStatusDto BuildStatus(
        Seat seat,
        IReadOnlyList<Booking> bookings,
        DateTimeOffset now)
    {
        if (!seat.IsActive)
        {
            return new DeskStatusDto(
                seat.SeatId,
                seat.Zone,
                seat.ComputerName,
                "Maintenance",
                seat.IsActive,
                null,
                null,
                null,
                null,
                null,
                "Workstation is under scheduled maintenance.",
                now.AddHours(-6));
        }

        var currentBooking = bookings.FirstOrDefault(booking =>
            string.Equals(booking.SeatId, seat.SeatId, StringComparison.OrdinalIgnoreCase)
            && now >= booking.StartTime
            && now <= booking.EndTime);

        if (currentBooking is null)
        {
            return new DeskStatusDto(
                seat.SeatId,
                seat.Zone,
                seat.ComputerName,
                "Available",
                seat.IsActive,
                null,
                null,
                null,
                null,
                null,
                "Ready for command center operations.",
                now.AddMinutes(-5));
        }

        return new DeskStatusDto(
            seat.SeatId,
            seat.Zone,
            seat.ComputerName,
            "Booked",
            seat.IsActive,
            currentBooking.StartTime,
            currentBooking.EndTime,
            currentBooking.BookedBy,
            currentBooking.Department,
            currentBooking.Purpose,
            currentBooking.Note,
            currentBooking.UpdatedAt);
    }

    private static IReadOnlyList<Booking> CreateBookings(DateTimeOffset now) =>
    [
        new(
            "CC-02",
            "Command Desk Team",
            "Operations Control",
            now.AddMinutes(-45),
            now.AddHours(2),
            "Incident monitoring",
            "Priority store support watch.",
            now.AddMinutes(-12)),
        new(
            "CC-04",
            "Operations Lead",
            "Store Support",
            now.AddMinutes(-15),
            now.AddHours(1.5),
            "Store support watch",
            "Escalation desk for shift coverage.",
            now.AddMinutes(-8)),
        new(
            "CC-09",
            "Network Team",
            "Infrastructure",
            now.AddHours(-1),
            now.AddMinutes(90),
            "Network health review",
            "Monitoring WAN and store network signals.",
            now.AddMinutes(-18)),
        new(
            "CC-14",
            "Monitoring Analyst",
            "Monitoring",
            now.AddMinutes(-30),
            now.AddHours(3),
            "Alert triage",
            "High-volume alert queue coverage.",
            now.AddMinutes(-6)),
        new(
            "CC-20",
            "Shift Supervisor",
            "Command Center",
            now.AddMinutes(-20),
            now.AddHours(2.5),
            "Shift command",
            "Supervisor desk assigned for current shift.",
            now.AddMinutes(-4)),
        new(
            "CC-22",
            "Business Continuity",
            "Risk Management",
            now.AddHours(2),
            now.AddHours(4),
            "Upcoming readiness review",
            "Future booking, currently available.",
            now.AddMinutes(-22))
    ];

    private static int GetSeatNumber(string seatId)
    {
        var digits = new string(seatId.Where(char.IsDigit).ToArray());
        return int.TryParse(digits, out var value) ? value : int.MaxValue;
    }
}
