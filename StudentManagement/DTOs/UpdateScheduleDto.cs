namespace StudentManagement.DTOs;

public class UpdateScheduleDto
{
    /// <summary>
    /// Số thứ tự slot (1–7). Nếu truyền SlotNumber thì TimeStart/TimeEnd
    /// sẽ được tự động lấy từ SlotDefinition — không cần nhập tay.
    /// </summary>
    public int? SlotNumber { get; set; }

    /// <summary>
    /// Chuỗi mô tả lịch học tuỳ ý (ví dụ: "Thứ 2, Thứ 4 – Slot 1 – P.A101").
    /// Vẫn dùng được nếu không chọn slot.
    /// </summary>
    public string? Schedule { get; set; }

    public DateTime? StartDate { get; set; }
}