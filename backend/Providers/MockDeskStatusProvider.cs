using Cpall.CommandCenter.Api.Models;

namespace Cpall.CommandCenter.Api.Providers;

public sealed class MockDeskStatusProvider : IDeskStatusProvider
{
    private static readonly IReadOnlyList<Seat> Seats =
    [
        new("A01", "Command Center", "โต๊ะบัญชาการ A01", true),
        new("A02", "Command Center", "โต๊ะบัญชาการ A02", true),
        new("A03", "Command Center", "โต๊ะบัญชาการ A03", true),
        new("A04", "Command Center", "โต๊ะบัญชาการ A04", true),
        new("A05", "Command Center", "โต๊ะบัญชาการ A05", true),
        new("A06", "Command Center", "โต๊ะบัญชาการ A06", false),
        new("A07", "Command Center", "โต๊ะบัญชาการ A07", true),
        new("A08", "Command Center", "โต๊ะบัญชาการ A08", true),
        new("A09", "Command Center", "โต๊ะบัญชาการ A09", true),
        new("A10", "Command Center", "โต๊ะบัญชาการ A10", true),
        new("A11", "Command Center", "โต๊ะบัญชาการ A11", true),
        new("A12", "Command Center", "โต๊ะบัญชาการ A12", false)
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
                "เครื่องอยู่ระหว่างซ่อมบำรุงตามรอบ",
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
                "พร้อมใช้งานสำหรับงานศูนย์บัญชาการ",
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
            "ทีมโต๊ะบัญชาการ",
            "ควบคุมปฏิบัติการ",
            now.AddMinutes(-45),
            now.AddHours(2),
            "ติดตามเหตุการณ์",
            "เฝ้าระวังและสนับสนุนสาขาเร่งด่วน",
            now.AddMinutes(-12)),
        new(
            "A04",
            "หัวหน้าปฏิบัติการ",
            "สนับสนุนสาขา",
            now.AddMinutes(-15),
            now.AddHours(1.5),
            "เฝ้าระวังงานสนับสนุนสาขา",
            "โต๊ะรับเรื่องเร่งด่วนประจำกะ",
            now.AddMinutes(-8)),
        new(
            "A08",
            "ทีมเครือข่าย",
            "โครงสร้างพื้นฐาน",
            now.AddHours(-1),
            now.AddMinutes(90),
            "ตรวจสุขภาพเครือข่าย",
            "ติดตามสัญญาณ WAN และเครือข่ายสาขา",
            now.AddMinutes(-18)),
        new(
            "A10",
            "นักวิเคราะห์ระบบเฝ้าระวัง",
            "เฝ้าระวังระบบ",
            now.AddMinutes(-30),
            now.AddHours(3),
            "คัดกรองแจ้งเตือน",
            "ดูแลคิวแจ้งเตือนปริมาณสูง",
            now.AddMinutes(-6)),
        new(
            "A11",
            "หัวหน้ากะ",
            "ศูนย์บัญชาการ",
            now.AddMinutes(-20),
            now.AddHours(2.5),
            "ควบคุมกะปฏิบัติงาน",
            "โต๊ะหัวหน้ากะสำหรับรอบปัจจุบัน",
            now.AddMinutes(-4)),
        new(
            "A12",
            "ทีมความต่อเนื่องทางธุรกิจ",
            "บริหารความเสี่ยง",
            now.AddHours(2),
            now.AddHours(4),
            "ตรวจความพร้อมล่วงหน้า",
            "เป็นรายการจองล่วงหน้า ขณะนี้ยังพร้อมใช้งาน",
            now.AddMinutes(-22))
    ];

    private static int GetSeatNumber(string seatId)
    {
        var digits = new string(seatId.Where(char.IsDigit).ToArray());
        return int.TryParse(digits, out var value) ? value : int.MaxValue;
    }
}
