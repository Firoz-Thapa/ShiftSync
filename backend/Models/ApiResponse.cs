namespace backend.Models;

public sealed class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public object? Errors { get; set; }

    public ApiResponse() { }

    public ApiResponse(T? data, string? message = null, bool success = true, object? errors = null)
    {
        Success = success;
        Data = data;
        Message = message;
        Errors = errors;
    }

    public static ApiResponse<T> Ok(T? data, string? message = null) =>
        new ApiResponse<T>(data, message, true);

    public static ApiResponse<T> Fail(string message, object? errors = null) =>
        new ApiResponse<T>(default, message, false, errors);
}

public sealed class PaginatedResponse<T>
{
    public IEnumerable<T> Data { get; set; } = Array.Empty<T>();
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public int TotalItems { get; set; }
    public int ItemsPerPage { get; set; }
}
