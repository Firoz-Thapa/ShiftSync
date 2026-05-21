namespace backend.Models;

public sealed class WorkplaceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#000000";
    public string PayType { get; set; } = "hourly";
    public decimal HourlyRate { get; set; }
    public decimal? MonthlySalary { get; set; }
    public string? Address { get; set; }
    public string? ContactInfo { get; set; }
    public string? Notes { get; set; }
    public bool IsRecurring { get; set; }
    public string? RecurrencePattern { get; set; }
    public DateTime? RecurrenceEndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class ShiftDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int WorkplaceId { get; set; }
    public WorkplaceDto? Workplace { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime StartDatetime { get; set; }
    public DateTime EndDatetime { get; set; }
    public int BreakDuration { get; set; }
    public string? Notes { get; set; }
    public bool IsConfirmed { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class StudySessionDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public DateTime StartDatetime { get; set; }
    public DateTime EndDatetime { get; set; }
    public string? Location { get; set; }
    public string SessionType { get; set; } = "other";
    public string Priority { get; set; } = "medium";
    public bool IsCompleted { get; set; }
    public string? Notes { get; set; }
    public bool IsRecurring { get; set; }
    public string? RecurrencePattern { get; set; }
    public DateTime? RecurrenceEndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class EmailProviderResponse
{
    public string Provider { get; set; } = string.Empty;
    public string RedirectUrl { get; set; } = string.Empty;
}
