using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;
using Cpall.CommandCenter.Api.Models;
using Microsoft.Extensions.Options;

namespace Cpall.CommandCenter.Api.Providers;

public sealed class SharePointDeskStatusProvider(
    HttpClient httpClient,
    IOptions<SharePointOptions> options) : IDeskStatusProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly SharePointOptions _options = options.Value;
    private readonly SemaphoreSlim _refreshLock = new(1, 1);
    private IReadOnlyList<Booking> _cachedBookings = [];
    private DateTimeOffset _cacheExpiresAt = DateTimeOffset.MinValue;
    private string? _accessToken;
    private DateTimeOffset _tokenExpiresAt = DateTimeOffset.MinValue;

    public static bool IsConfigured(SharePointOptions options) =>
        !string.IsNullOrWhiteSpace(options.SiteUrl)
        && !string.IsNullOrWhiteSpace(options.ListTitle)
        && !string.IsNullOrWhiteSpace(options.TenantId)
        && !string.IsNullOrWhiteSpace(options.ClientId)
        && !string.IsNullOrWhiteSpace(options.ClientSecret);

    public async Task<IReadOnlyList<DeskStatusDto>> GetDeskStatusesAsync(
        DateTimeOffset now,
        DateOnly? viewDate = null,
        CancellationToken cancellationToken = default)
    {
        var bookings = await GetCachedBookingsAsync(now, cancellationToken);

        return SeatCatalog.Seats
            .OrderBy(seat => SeatCatalog.GetSeatNumber(seat.SeatId))
            .Select(seat => BuildStatus(seat, bookings, now, viewDate))
            .ToList();
    }

    public async Task<IReadOnlyList<DepartmentUsageDto>> GetDepartmentUsageRankingAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        var bookings = await GetCachedBookingsAsync(now, cancellationToken);
        return BuildDepartmentRanking(bookings, now, _options.UsageRankingDays);
    }

    private async Task<IReadOnlyList<Booking>> GetCachedBookingsAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (_cachedBookings.Count > 0 && DateTimeOffset.UtcNow < _cacheExpiresAt)
        {
            return _cachedBookings;
        }

        await _refreshLock.WaitAsync(cancellationToken);
        try
        {
            if (_cachedBookings.Count > 0 && DateTimeOffset.UtcNow < _cacheExpiresAt)
            {
                return _cachedBookings;
            }

            try
            {
                _cachedBookings = await FetchBookingsAsync(cancellationToken);
                _cacheExpiresAt = DateTimeOffset.UtcNow.AddSeconds(Math.Max(5, _options.RefreshSeconds));
            }
            catch when (_cachedBookings.Count > 0)
            {
                _cacheExpiresAt = DateTimeOffset.UtcNow.AddSeconds(10);
            }

            return _cachedBookings;
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    private async Task<IReadOnlyList<Booking>> FetchBookingsAsync(CancellationToken cancellationToken)
    {
        var token = await GetAccessTokenAsync(cancellationToken);
        var requestUrl = BuildListItemsUrl();
        var bookings = new List<Booking>();
        var page = 0;

        while (!string.IsNullOrWhiteSpace(requestUrl) && page < Math.Max(1, _options.MaxPages))
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            using var response = await httpClient.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"SharePoint list request failed ({(int)response.StatusCode}): {body}");
            }

            using var document = JsonDocument.Parse(body);
            var root = document.RootElement;

            if (root.TryGetProperty("value", out var value) && value.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in value.EnumerateArray())
                {
                    if (!item.TryGetProperty("fields", out var fields))
                    {
                        continue;
                    }

                    var booking = MapBooking(fields, item);
                    if (booking is not null)
                    {
                        bookings.Add(booking);
                    }
                }
            }

            requestUrl = ReadString(root, "@odata.nextLink");
            page++;
        }

        return bookings;
    }

    private async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(_accessToken)
            && DateTimeOffset.UtcNow < _tokenExpiresAt)
        {
            return _accessToken;
        }

        var tokenUrl = $"https://login.microsoftonline.com/{Uri.EscapeDataString(_options.TenantId)}/oauth2/v2.0/token";
        using var request = new HttpRequestMessage(HttpMethod.Post, tokenUrl)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = _options.ClientId,
                ["client_secret"] = _options.ClientSecret,
                ["scope"] = "https://graph.microsoft.com/.default",
                ["grant_type"] = "client_credentials"
            })
        };

        using var response = await httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Microsoft Graph token request failed ({(int)response.StatusCode}): {body}");
        }

        using var document = JsonDocument.Parse(body);
        var root = document.RootElement;
        _accessToken = ReadString(root, "access_token")
            ?? throw new InvalidOperationException("Microsoft Graph token response did not include access_token.");

        var expiresIn = root.TryGetProperty("expires_in", out var expiresElement)
            && expiresElement.TryGetInt32(out var seconds)
                ? seconds
                : 3600;

        _tokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(Math.Max(60, expiresIn - 120));
        return _accessToken;
    }

    private string BuildListItemsUrl()
    {
        var siteUri = new Uri(_options.SiteUrl);
        var sitePath = siteUri.AbsolutePath;
        var listIndex = sitePath.IndexOf("/Lists/", StringComparison.OrdinalIgnoreCase);

        if (listIndex >= 0)
        {
            sitePath = sitePath[..listIndex];
        }

        sitePath = sitePath.TrimEnd('/');
        var encodedSitePath = EncodeSharePointPath(sitePath);
        var listTitle = Uri.EscapeDataString(_options.ListTitle);
        var pageSize = Math.Clamp(_options.PageSize, 1, 5000);

        return $"https://graph.microsoft.com/v1.0/sites/{siteUri.Host}:{encodedSitePath}:/lists/{listTitle}/items?$expand=fields&$top={pageSize}";
    }

    private Booking? MapBooking(JsonElement fields, JsonElement item)
    {
        var seatId = ReadString(
            fields,
            _options.SeatIdField,
            "SeatId",
            "SeatID",
            "SeatNo",
            "DeskId",
            "DeskID",
            "DeskNo",
            "Desk",
            "โต๊ะ",
            "เลขโต๊ะ",
            "Computer",
            "Title");
        var status = NormalizeStatus(ReadString(fields, _options.StatusField, "Status", "State", "BookingStatus"));

        if (!string.Equals(status, "Confirm", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(status, "Confirmed", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(status, "Approved", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var startTime = ReadDateTime(
            fields,
            _options.StartTimeField,
            "StartTime",
            "StartDate",
            "Start Date",
            "BookedFrom",
            "From",
            "Start",
            "เริ่ม",
            "เริ่มต้น",
            "วันเริ่ม");
        var endTime = ReadDateTime(
            fields,
            _options.EndTimeField,
            "EndTime",
            "EndDate",
            "End Date",
            "BookedTo",
            "To",
            "End",
            "จบ",
            "สิ้นสุด",
            "วันสิ้นสุด");

        if ((startTime is null || endTime is null)
            && !string.IsNullOrWhiteSpace(ReadString(fields, _options.PeriodField, "Period", "ช่วงเวลา")))
        {
            var period = ReadString(fields, _options.PeriodField, "Period", "ช่วงเวลา");
            if (TryReadTimeRangeFromPeriod(period, out var periodStart, out var periodEnd))
            {
                var bookingDate = ReadDateTime(
                    fields,
                    _options.BookingDateField,
                    "BookingDate",
                    "Booking Date",
                    "Date",
                    "วันที่");

                if (bookingDate is not null)
                {
                    var localDate = DateOnly.FromDateTime(bookingDate.Value.DateTime);
                    startTime ??= new DateTimeOffset(localDate.ToDateTime(periodStart), bookingDate.Value.Offset);
                    endTime ??= new DateTimeOffset(localDate.ToDateTime(periodEnd), bookingDate.Value.Offset);
                }
            }
        }

        if (string.IsNullOrWhiteSpace(seatId) || startTime is null || endTime is null)
        {
            return null;
        }

        seatId = NormalizeSeatId(seatId);

        var bookedBy = ReadString(
                fields,
                _options.BookedByField,
                _options.FullNameField,
                "BookedBy",
                "Requester",
                "Requestor",
                "User",
                "Name",
                "Author",
                "ผู้จอง",
                "ชื่อผู้จอง",
                "FullName",
                "ชื่อ",
                "ชื่อ-สกุล")
            ?? "ไม่ระบุผู้จอง";
        var department = NormalizeDepartment(ReadString(
            fields,
            _options.DepartmentField,
            "Department",
            "Dept",
            "Unit",
            "Organization",
            "Team",
            "ฝ่าย",
            "แผนก",
            "หน่วยงาน"));
        var purpose = ReadString(fields, _options.PurposeField, "Purpose", "Objective", "Subject", "Title", "วัตถุประสงค์", "เหตุผล") ?? "ใช้งานศูนย์บัญชาการ";
        var note = ReadString(fields, _options.NoteField, "Note", "Notes", "Remark", "Remarks", "Description", "บันทึก", "หมายเหตุ") ?? "";
        var updatedAt =
            ReadDateTime(fields, _options.UpdatedAtField, "Modified", "UpdatedAt", "อัปเดตเมื่อ", "LastModified")
            ?? ReadDateTime(item, "lastModifiedDateTime")
            ?? DateTimeOffset.UtcNow;

        return new Booking(
            seatId.Trim().ToUpperInvariant(),
            bookedBy,
            department,
            startTime.Value,
            endTime.Value,
            purpose,
            note,
            updatedAt);
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
                now);
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
                now);
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

    private static IReadOnlyList<DepartmentUsageDto> BuildDepartmentRanking(
        IReadOnlyList<Booking> bookings,
        DateTimeOffset now,
        int rankingDays)
    {
        var windowStart = now.AddDays(-Math.Max(1, rankingDays));

        return bookings
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
    }

    private static string NormalizeDepartment(string? department) =>
        string.IsNullOrWhiteSpace(department) ? "ไม่ระบุหน่วยงาน" : department.Trim();

    private static string NormalizeStatus(string? status) =>
        string.IsNullOrWhiteSpace(status) ? string.Empty : status.Trim();

    private static string NormalizeSeatId(string seatId)
    {
        var trimmed = seatId.Trim().ToUpperInvariant();
        var letters = new string(trimmed.TakeWhile(char.IsLetter).ToArray());
        var digits = new string(trimmed.SkipWhile(char.IsLetter).TakeWhile(char.IsDigit).ToArray());
        var suffix = new string(trimmed.SkipWhile(ch => char.IsLetter(ch) || char.IsDigit(ch)).ToArray());

        if (string.IsNullOrWhiteSpace(letters) || string.IsNullOrWhiteSpace(digits))
        {
            return trimmed;
        }

        return $"{letters}{digits.PadLeft(2, '0')}{suffix}";
    }

    private static bool TryReadTimeRangeFromPeriod(string? period, out TimeOnly start, out TimeOnly end)
    {
        start = default;
        end = default;

        if (string.IsNullOrWhiteSpace(period))
        {
            return false;
        }

        var colonPattern = new System.Text.RegularExpressions.Regex(@"(?<start>\d{1,2}:\d{2})\s*[-–]\s*(?<end>\d{1,2}:\d{2})");
        var match = colonPattern.Match(period);
        if (!match.Success)
        {
            return false;
        }

        return TimeOnly.TryParse(match.Groups["start"].Value, CultureInfo.InvariantCulture, DateTimeStyles.None, out start)
            && TimeOnly.TryParse(match.Groups["end"].Value, CultureInfo.InvariantCulture, DateTimeStyles.None, out end);
    }

    private static string EncodeSharePointPath(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || path == "/")
        {
            return "";
        }

        var segments = path
            .Split('/', StringSplitOptions.RemoveEmptyEntries)
            .Select(Uri.EscapeDataString);

        return "/" + string.Join("/", segments);
    }

    private static DateTimeOffset? ReadDateTime(JsonElement source, params string?[] names)
    {
        var text = ReadString(source, names);

        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        if (DateTimeOffset.TryParse(
            text,
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
            out var offset))
        {
            return offset;
        }

        var thaiCulture = CultureInfo.GetCultureInfo("th-TH");

        if (DateTimeOffset.TryParse(
            text,
            thaiCulture,
            DateTimeStyles.AssumeLocal,
            out offset))
        {
            return offset;
        }

        if (TryParseThaiBuddhistDateTime(text, out var thaiDateTime))
        {
            return new DateTimeOffset(thaiDateTime);
        }

        return DateTime.TryParse(
            text,
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeLocal,
            out var dateTime)
                ? new DateTimeOffset(dateTime)
                : null;
    }

    private static bool TryParseThaiBuddhistDateTime(string text, out DateTime dateTime)
    {
        dateTime = default;

        var normalized = System.Text.RegularExpressions.Regex.Replace(text.Trim(), @"\s+", " ");
        var culture = CultureInfo.GetCultureInfo("th-TH");
        var styles = DateTimeStyles.AllowWhiteSpaces | DateTimeStyles.AssumeLocal;

        if (DateTime.TryParse(normalized, culture, styles, out dateTime))
        {
            return true;
        }

        var match = System.Text.RegularExpressions.Regex.Match(
            normalized,
            @"(?<day>\d{1,2})[/-](?<month>\d{1,2})[/-](?<year>\d{4})(?:\s+(?<time>\d{1,2}:\d{2}(?::\d{2})?))?");

        if (!match.Success)
        {
            return false;
        }

        var day = int.Parse(match.Groups["day"].Value, CultureInfo.InvariantCulture);
        var month = int.Parse(match.Groups["month"].Value, CultureInfo.InvariantCulture);
        var year = int.Parse(match.Groups["year"].Value, CultureInfo.InvariantCulture);
        if (year > 2400)
        {
            year -= 543;
        }

        var timeText = match.Groups["time"].Success ? match.Groups["time"].Value : "00:00";
        if (!TimeOnly.TryParse(timeText, CultureInfo.InvariantCulture, DateTimeStyles.None, out var timeOnly))
        {
            timeOnly = TimeOnly.MinValue;
        }

        try
        {
            dateTime = new DateTime(year, month, day, timeOnly.Hour, timeOnly.Minute, timeOnly.Second, DateTimeKind.Local);
            return true;
        }
        catch (ArgumentOutOfRangeException)
        {
            return false;
        }
    }

    private static string? ReadString(JsonElement source, params string?[] names)
    {
        if (source.ValueKind != JsonValueKind.Object)
        {
            return StringFromValue(source);
        }

        foreach (var name in names)
        {
            if (string.IsNullOrWhiteSpace(name)
                || !source.TryGetProperty(name, out var value))
            {
                continue;
            }

            var text = StringFromValue(value);
            if (!string.IsNullOrWhiteSpace(text))
            {
                return text.Trim();
            }
        }

        return null;
    }

    private static string? StringFromValue(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.GetRawText(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Object => ReadString(value, "DisplayName", "LookupValue", "Email", "Title", "Value", "Label"),
            JsonValueKind.Array => string.Join(", ", value.EnumerateArray().Select(StringFromValue).Where(text => !string.IsNullOrWhiteSpace(text))),
            _ => null
        };
    }
}
