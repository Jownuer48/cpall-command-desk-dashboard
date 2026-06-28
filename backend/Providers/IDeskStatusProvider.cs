using Cpall.CommandCenter.Api.Models;

namespace Cpall.CommandCenter.Api.Providers;

public interface IDeskStatusProvider
{
    Task<IReadOnlyList<DeskStatusDto>> GetDeskStatusesAsync(
        DateTimeOffset now,
        DateOnly? viewDate = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DepartmentUsageDto>> GetDepartmentUsageRankingAsync(
        DateTimeOffset now,
        CancellationToken cancellationToken = default);
}
