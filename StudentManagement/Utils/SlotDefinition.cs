namespace StudentManagement.Utils;

/// <summary>
/// Định nghĩa các slot học cố định trong ngày.
/// </summary>
public static class SlotDefinition
{
    public record Slot(int Number, string TimeStart, string TimeEnd, string Label);

    public static readonly IReadOnlyList<Slot> All = new[]
    {
        new Slot(1, "07:15", "09:15", "Slot 1 (07:15 – 09:15)"),
        new Slot(2, "09:25", "11:25", "Slot 2 (09:25 – 11:25)"),
        new Slot(3, "12:00", "14:00", "Slot 3 (12:00 – 14:00)"),
        new Slot(4, "14:10", "16:10", "Slot 4 (14:10 – 16:10)"),
        new Slot(5, "16:20", "18:20", "Slot 5 (16:20 – 18:20)"),
        new Slot(6, "18:30", "20:30", "Slot 6 (18:30 – 20:30)"),
        new Slot(7, "20:30", "22:30", "Slot 7 (20:30 – 22:30)"),
    };

    /// <summary>Lấy Slot theo số thứ tự (1–7). Trả về null nếu không hợp lệ.</summary>
    public static Slot? Get(int slotNumber)
        => All.FirstOrDefault(s => s.Number == slotNumber);

    /// <summary>Kiểm tra slotNumber có hợp lệ không.</summary>
    public static bool IsValid(int slotNumber)
        => slotNumber >= 1 && slotNumber <= All.Count;
}