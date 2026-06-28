using Cpall.CommandCenter.Api.Models;

namespace Cpall.CommandCenter.Api.Providers;

public sealed class MockDeskStatusProvider : IDeskStatusProvider
{
    public Task<IReadOnlyList<DeskStatusDto>> GetDeskStatusesAsync(
        DateTimeOffset now,
        DateOnly? viewDate = null,
        CancellationToken cancellationToken = default)
    {
        var bookings = CreateBookings(now);

        var statuses = SeatCatalog.Seats
            .OrderBy(seat => SeatCatalog.GetSeatNumber(seat.SeatId))
            .Select(seat => BuildStatus(seat, bookings, now, viewDate))
            .ToList();

        return Task.FromResult<IReadOnlyList<DeskStatusDto>>(statuses);
    }

    public Task<IReadOnlyList<DepartmentUsageDto>> GetDepartmentUsageRankingAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var windowStart = now.AddDays(-30);
        var ranking = CreateBookings(now)
            .Where(booking => booking.StartTime >= windowStart && booking.StartTime <= now)
            .GroupBy(booking => NormalizeDepartment(booking.Department))
            .Select(group => new DepartmentUsageDto(
                group.Key,
                group.Count(),
                group.Max(booking => (DateTimeOffset?)booking.StartTime)))
            .OrderByDescending(item => item.Count)
            .ThenBy(item => item.Department, StringComparer.OrdinalIgnoreCase)
            .Take(10)
            .ToList();

        return Task.FromResult<IReadOnlyList<DepartmentUsageDto>>(ranking);
    }

    private static DeskStatusDto BuildStatus(
        Seat seat,
        IReadOnlyList<Booking> bookings,
        DateTimeOffset now,
        DateOnly? viewDate)
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

        var currentBooking = FindBookingForView(seat, bookings, now, viewDate);

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

    private static Booking? FindBookingForView(
        Seat seat,
        IReadOnlyList<Booking> bookings,
        DateTimeOffset now,
        DateOnly? viewDate)
    {
        var seatBookings = bookings
            .Where(booking => string.Equals(booking.SeatId, seat.SeatId, StringComparison.OrdinalIgnoreCase));

        if (viewDate is null)
        {
            return seatBookings
                .Where(booking => now >= booking.StartTime && now <= booking.EndTime)
                .OrderByDescending(booking => booking.StartTime)
                .FirstOrDefault();
        }

        var dayStart = new DateTimeOffset(viewDate.Value.ToDateTime(TimeOnly.MinValue), now.Offset);
        var dayEnd = dayStart.AddDays(1);

        return seatBookings
            .Where(booking => booking.StartTime < dayEnd && booking.EndTime >= dayStart)
            .OrderBy(booking => booking.StartTime)
            .FirstOrDefault();
    }

    private static IReadOnlyList<Booking> CreateBookings(DateTimeOffset now)
    {
        var dayNumber = DateOnly.FromDateTime(now.DateTime).DayNumber;
        var variant = Math.Abs(dayNumber % 3);

        return variant switch
        {
            1 =>
            [
                CreateBooking(now, "A02", "ทีมวิเคราะห์ภาพ", "เฝ้าระวังระบบ", -35, 130, "ตรวจสอบภาพเหตุการณ์"),
                CreateBooking(now, "A03", "ทีมสนับสนุนสาขา", "สนับสนุนสาขา", -20, 95, "ติดตามเคสจากสาขา"),
                CreateBooking(now, "A07", "ทีมความปลอดภัย", "บริหารความเสี่ยง", -50, 160, "คัดกรองเหตุผิดปกติ"),
                CreateBooking(now, "A09", "ทีมประสานงานกลาง", "ศูนย์บัญชาการ", 30, 190, "เตรียมกะถัดไป")
            ],
            2 =>
            [
                CreateBooking(now, "A01", "หัวหน้ากะ", "ศูนย์บัญชาการ", -25, 150, "ควบคุมกะปฏิบัติงาน"),
                CreateBooking(now, "A05", "ทีมเครือข่าย", "โครงสร้างพื้นฐาน", -65, 110, "ตรวจสุขภาพเครือข่าย"),
                CreateBooking(now, "A08", "ทีมโต๊ะบัญชาการ", "ควบคุมปฏิบัติการ", -40, 145, "ติดตามเหตุการณ์"),
                CreateBooking(now, "A10", "ทีมบริการระบบ", "เฝ้าระวังระบบ", 45, 220, "ตรวจความพร้อมระบบ")
            ],
            _ =>
            [
                CreateBooking(now, "A01", "ทีมโต๊ะบัญชาการ", "ควบคุมปฏิบัติการ", -45, 120, "ติดตามเหตุการณ์"),
                CreateBooking(now, "A04", "หัวหน้าปฏิบัติการ", "สนับสนุนสาขา", -15, 90, "เฝ้าระวังงานสนับสนุนสาขา"),
                CreateBooking(now, "A08", "ทีมเครือข่าย", "โครงสร้างพื้นฐาน", -60, 90, "ตรวจสุขภาพเครือข่าย"),
                CreateBooking(now, "A10", "นักวิเคราะห์ระบบเฝ้าระวัง", "เฝ้าระวังระบบ", -30, 180, "คัดกรองแจ้งเตือน"),
                CreateBooking(now, "A11", "หัวหน้ากะ", "ศูนย์บัญชาการ", -20, 150, "ควบคุมกะปฏิบัติงาน"),
                CreateBooking(now, "A12", "ทีมความต่อเนื่องทางธุรกิจ", "บริหารความเสี่ยง", 120, 240, "ตรวจความพร้อมล่วงหน้า")
            ]
        };
    }

    private static Booking CreateBooking(
        DateTimeOffset now,
        string seatId,
        string bookedBy,
        string department,
        double startOffsetMinutes,
        double durationMinutes,
        string purpose)
    {
        var start = now.AddMinutes(startOffsetMinutes);
        return new Booking(
            seatId,
            bookedBy,
            department,
            start,
            start.AddMinutes(durationMinutes),
            purpose,
            "ข้อมูลตัวอย่างสำหรับทดสอบการแสดงผลรายวัน",
            now.AddMinutes(-Math.Min(5, Math.Abs(startOffsetMinutes))));
    }

    private static string NormalizeDepartment(string? department) =>
        string.IsNullOrWhiteSpace(department) ? "ไม่ระบุหน่วยงาน" : department.Trim();
}
