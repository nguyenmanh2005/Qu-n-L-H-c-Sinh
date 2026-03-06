namespace StudentManagement.Services;

public class OperationResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public IEnumerable<string>? Errors { get; set; }

    public static OperationResult Ok(string message)
        => new OperationResult { Success = true, Message = message };

    public static OperationResult Fail(string message, IEnumerable<string>? errors = null)
        => new OperationResult { Success = false, Message = message, Errors = errors };
}

public class OperationResult<T> : OperationResult
{
    public T? Data { get; set; }

    public static OperationResult<T> Ok(string message, T data)
        => new OperationResult<T>
        {
            Success = true,
            Message = message,
            Data = data
        };

    public static new OperationResult<T> Fail(string message, IEnumerable<string>? errors = null)
        => new OperationResult<T>
        {
            Success = false,
            Message = message,
            Errors = errors,
            Data = default
        };
}