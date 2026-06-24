using Cpall.CommandCenter.Api.Models;

namespace Cpall.CommandCenter.Api.Providers;

public sealed class MockDeskStatusProvider : IDeskStatusProvider
{
    private static readonly IReadOnlyList<Seat> Seats =
    [
        new("A01", "Command Center", "Command-Desk-A01", true),
        new("A02", "Command Center", "Command-Desk-A02", true),
        new("A03", "Command Center", "Command-Desk-A03", true),
        new("A04", "Command Center", "Command-Desk-A04", true),
        new("A05", "Command Center", "Command-Desk-A05", true),
        new("A06", "Command Center", "Command-Desk-A06", false),
        new("A07", "Command Center", "Command-Desk-A07", true),
        new("A08", "Command Center", "Command-Desk-A08", true),
        new("A09", "Command Center", "Command-Desk-A09", true),
        new("A10", "Command Center", "Command-Desk-A10", true),
        new("A11", "Command Center", "Command-Desk-A11", true),
        new("A12", "Command Center", "Command-Desk-A12", false)
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
            "A01",
            "Command Desk Team",
            "Operations Control",
            now.AddMinutes(-45),
            now.AddHours(2),
            "Incident monitoring",
            "Priority store support watch.",
            now.AddMinutes(-12)),
        new(
            "A04",
            "Operations Lead",
            "Store Support",
            now.AddMinutes(-15),
            now.AddHours(1.5),
            "Store support watch",
            "Escalation desk for shift coverage.",
            now.AddMinutes(-8)),
        new(
            "A08",
            "Network Team",
            "Infrastructure",
            now.AddHours(-1),
            now.AddMinutes(90),
            "Network health review",
            "Monitoring WAN and store network signals.",
            now.AddMinutes(-18)),
        new(
            "A10",
            "Monitoring Analyst",
            "Monitoring",
            now.AddMinutes(-30),
            now.AddHours(3),
            "Alert triage",
            "High-volume alert queue coverage.",
            now.AddMinutes(-6)),
        new(
            "A11",
            "Shift Supervisor",
            "Command Center",
            now.AddMinutes(-20),
            now.AddHours(2.5),
            "Shift command",
            "Supervisor desk assigned for current shift.",
            now.AddMinutes(-4)),
        new(
            "A12",
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
