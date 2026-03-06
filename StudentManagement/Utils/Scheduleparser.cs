using System.Text.RegularExpressions;
using StudentManagement.DTOs;
using StudentManagement.Utils;

namespace StudentManagement.Utils;

public static class ScheduleParser
{
    private static readonly Regex TimeRangeRegex =
        new(@"(\d{1,2})[:\.](\d{2})\s*[-–—]\s*(\d{1,2})[:\.](\d{2})", RegexOptions.Compiled);

    private static readonly Regex TimeSingleRegex =
        new(@"(\d{1,2})[:\.](\d{2})", RegexOptions.Compiled);

    private static readonly Regex RoomRegex =
        new(@"(?:P\.|Phòng|Phong|Room)\s*([A-Za-z0-9\.\-]+)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // Nhận diện "slot 1" … "slot 7" trong chuỗi lịch
    private static readonly Regex SlotRegex =
        new(@"\bslot\s*([1-7])\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly (string Key, int Day)[] DayMap =
    {
        ("chủ nhật", 0), ("chu nhat", 0), ("sunday",    0), ("sun", 0), ("cn",  0),
        ("thứ hai",  1), ("thu hai",  1), ("monday",    1), ("mon", 1), ("thứ 2", 1), ("thu 2", 1), ("t2", 1),
        ("thứ ba",   2), ("thu ba",   2), ("tuesday",   2), ("tue", 2), ("thứ 3", 2), ("thu 3", 2), ("t3", 2),
        ("thứ tư",   3), ("thu tu",   3), ("wednesday", 3), ("wed", 3), ("thứ 4", 3), ("thu 4", 3), ("t4", 3),
        ("thứ năm",  4), ("thu nam",  4), ("thursday",  4),             ("thứ 5", 4), ("thu 5", 4), ("t5", 4),
        ("thứ sáu",  5), ("thu sau",  5), ("friday",    5), ("fri", 5), ("thứ 6", 5), ("thu 6", 5), ("t6", 5),
        ("thứ bảy",  6), ("thu bay",  6), ("saturday",  6), ("sat", 6), ("thứ 7", 6), ("thu 7", 6), ("t7", 6),
    };

    // ── Parse từ UpdateScheduleDto (ưu tiên SlotNumber) ─────────────────
    /// <summary>
    /// Parse lịch từ DTO. Nếu SlotNumber hợp lệ thì dùng giờ từ SlotDefinition;
    /// nếu không thì parse chuỗi Schedule như cũ.
    /// </summary>
    public static ParsedSchedule ParseFromDto(UpdateScheduleDto dto)
    {
        // Nếu admin chọn slot → lấy giờ từ SlotDefinition
        if (dto.SlotNumber.HasValue && SlotDefinition.IsValid(dto.SlotNumber.Value))
        {
            var slot = SlotDefinition.Get(dto.SlotNumber.Value)!;
            var result = Parse(dto.Schedule); // vẫn parse ngày & phòng từ chuỗi
            result.SlotNumber = slot.Number;
            result.TimeStart  = slot.TimeStart;
            result.TimeEnd    = slot.TimeEnd;
            return result;
        }

        return Parse(dto.Schedule);
    }

    // ── Parse → ParsedSchedule ───────────────────────────────────────────
    public static ParsedSchedule Parse(string? raw)
    {
        var result = new ParsedSchedule { Raw = raw };
        if (string.IsNullOrWhiteSpace(raw)) return result;

        result.DaysOfWeek = ExtractDays(raw);
        result.Room       = ExtractRoom(raw);

        // Ưu tiên: slot keyword → SlotDefinition; sau đó mới parse giờ thủ công
        var slotMatch = SlotRegex.Match(raw);
        if (slotMatch.Success && int.TryParse(slotMatch.Groups[1].Value, out int slotNum))
        {
            var slot = SlotDefinition.Get(slotNum);
            if (slot != null)
            {
                result.SlotNumber = slot.Number;
                result.TimeStart  = slot.TimeStart;
                result.TimeEnd    = slot.TimeEnd;
                return result;
            }
        }

        ExtractTime(raw, result);
        return result;
    }

    // ── ParseSlots → List<ScheduleSlotDto> ──────────────────────────────
    public static List<ScheduleSlotDto> ParseSlots(string? raw)
    {
        var parsed = Parse(raw);
        return parsed.DaysOfWeek.Select(day => new ScheduleSlotDto
        {
            DayOfWeek  = day,
            DayName    = day switch
            {
                0 => "Chủ nhật",
                1 => "Thứ 2", 2 => "Thứ 3", 3 => "Thứ 4",
                4 => "Thứ 5", 5 => "Thứ 6", 6 => "Thứ 7",
                _ => "?"
            },
            SlotNumber = parsed.SlotNumber,
            TimeStart  = parsed.TimeStart ?? "",
            TimeEnd    = parsed.TimeEnd   ?? "",
            Room       = parsed.Room
        }).ToList();
    }

    /// <summary>Trả về int[] DayOfWeek – dùng nhanh khi chỉ cần check ngày.</summary>
    public static int[] ParseDaysOfWeek(string? raw)
        => Parse(raw).DaysOfWeek;

    // ── Private helpers ──────────────────────────────────────────────────
    private static int[] ExtractDays(string s)
    {
        var lower     = s.ToLowerInvariant();
        var foundDays = new HashSet<int>();
        foreach (var (key, day) in DayMap)
        {
            int idx = 0;
            while ((idx = lower.IndexOf(key, idx, StringComparison.Ordinal)) >= 0)
            {
                bool okBefore = idx == 0                         || !char.IsLetterOrDigit(lower[idx - 1]);
                bool okAfter  = idx + key.Length >= lower.Length || !char.IsLetterOrDigit(lower[idx + key.Length]);
                if (okBefore && okAfter) foundDays.Add(day);
                idx++;
            }
        }
        return foundDays.OrderBy(d => d == 0 ? 7 : d).ToArray();
    }

    private static void ExtractTime(string s, ParsedSchedule result)
    {
        var rangeMatch = TimeRangeRegex.Match(s);
        if (rangeMatch.Success)
        {
            result.TimeStart = Pad(rangeMatch.Groups[1].Value, rangeMatch.Groups[2].Value);
            result.TimeEnd   = Pad(rangeMatch.Groups[3].Value, rangeMatch.Groups[4].Value);
            return;
        }
        var singleMatch = TimeSingleRegex.Match(s);
        if (singleMatch.Success)
            result.TimeStart = Pad(singleMatch.Groups[1].Value, singleMatch.Groups[2].Value);
    }

    private static string Pad(string h, string m) => $"{h.PadLeft(2, '0')}:{m}";

    private static string? ExtractRoom(string s)
    {
        var match = RoomRegex.Match(s);
        return match.Success ? match.Value.Trim() : null;
    }
}

public class ParsedSchedule
{
    public string? Raw        { get; set; }
    public int[]   DaysOfWeek { get; set; } = Array.Empty<int>();
    public int?    SlotNumber { get; set; }
    public string? TimeStart  { get; set; }
    public string? TimeEnd    { get; set; }
    public string? Room       { get; set; }
}