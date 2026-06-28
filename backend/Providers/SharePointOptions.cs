namespace Cpall.CommandCenter.Api.Providers;

public sealed class SharePointOptions
{
    public bool Enabled { get; set; }
    public string SiteUrl { get; set; } = "https://cpallgroup.sharepoint.com/sites/MST-CCTV-Booking-System";
    public string ListTitle { get; set; } = "CCTVBookings_DB_tblBooks";
    public string TenantId { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
    public string SeatIdField { get; set; } = "SeatId";
    public string BookingIdField { get; set; } = "BookingID";
    public string BookingDateField { get; set; } = "BookingDate";
    public string PeriodField { get; set; } = "Period";
    public string FullNameField { get; set; } = "FullName";
    public string PhoneField { get; set; } = "Phone";
    public string BookedByField { get; set; } = "BookedBy";
    public string DepartmentField { get; set; } = "Department";
    public string StartTimeField { get; set; } = "StartTime";
    public string EndTimeField { get; set; } = "EndTime";
    public string PurposeField { get; set; } = "Purpose";
    public string NoteField { get; set; } = "Note";
    public string StatusField { get; set; } = "Status";
    public string UpdatedAtField { get; set; } = "Modified";
    public int RefreshSeconds { get; set; } = 30;
    public int UsageRankingDays { get; set; } = 30;
    public int PageSize { get; set; } = 5000;
    public int MaxPages { get; set; } = 10;
}
