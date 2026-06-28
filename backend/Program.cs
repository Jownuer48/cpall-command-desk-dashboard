using Cpall.CommandCenter.Api.Providers;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration
    .AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.local.json", optional: true, reloadOnChange: true);

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "https://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.Configure<SharePointOptions>(builder.Configuration.GetSection("SharePoint"));
builder.Services.AddHttpClient<SharePointDeskStatusProvider>();
builder.Services.AddSingleton<MockDeskStatusProvider>();
builder.Services.AddSingleton<IDeskStatusProvider>(services =>
{
    var options = services.GetRequiredService<IOptions<SharePointOptions>>().Value;

    if (!SharePointDeskStatusProvider.IsConfigured(options))
    {
        return services.GetRequiredService<MockDeskStatusProvider>();
    }

    return services.GetRequiredService<SharePointDeskStatusProvider>();
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("FrontendDev");
}

app.UseDefaultFiles();
app.UseStaticFiles();

var api = app.MapGroup("/api");

api.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    timestamp = DateTimeOffset.UtcNow
}));

api.MapGet("/desk-status", async (
    DateOnly? date,
    IDeskStatusProvider provider,
    CancellationToken cancellationToken) =>
{
    var now = ResolveViewInstant(date);
    var today = DateOnly.FromDateTime(DateTimeOffset.Now.DateTime);
    var dayView = date == today ? null : date;
    var statuses = await provider.GetDeskStatusesAsync(now, dayView, cancellationToken);
    return Results.Ok(statuses);
});

api.MapGet("/department-usage-ranking", async (
    IDeskStatusProvider provider,
    CancellationToken cancellationToken) =>
{
    var ranking = await provider.GetDepartmentUsageRankingAsync(DateTimeOffset.Now, cancellationToken);
    return Results.Ok(ranking);
});

app.MapFallbackToFile("index.html");

app.Run();

static DateTimeOffset ResolveViewInstant(DateOnly? date)
{
    var now = DateTimeOffset.Now;

    if (date is null)
    {
        return now;
    }

    return new DateTimeOffset(date.Value.ToDateTime(TimeOnly.FromDateTime(now.DateTime)), now.Offset);
}
