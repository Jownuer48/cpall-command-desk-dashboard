using Cpall.CommandCenter.Api.Providers;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddSingleton<IDeskStatusProvider, MockDeskStatusProvider>();

var app = builder.Build();

app.UseCors("FrontendDev");

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    timestamp = DateTimeOffset.UtcNow
}));

app.MapGet("/api/desk-status", async (
    IDeskStatusProvider provider,
    CancellationToken cancellationToken) =>
{
    var statuses = await provider.GetDeskStatusesAsync(DateTimeOffset.Now, cancellationToken);
    return Results.Ok(statuses);
});

app.Run();
