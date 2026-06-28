namespace Cpall.CommandCenter.Api.Models;

public sealed record DepartmentUsageDto(
    string Department,
    int Count,
    DateTimeOffset? LastUsedAt);
