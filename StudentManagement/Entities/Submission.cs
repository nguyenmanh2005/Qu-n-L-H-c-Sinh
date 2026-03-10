namespace StudentManagement.Entities;
public class Submission
{
    public int        Id           { get; set; }
    public int        AssignmentId { get; set; }
    public Assignment? Assignment  { get; set; }
    public string     StudentId    { get; set; } = string.Empty;
    public string     FileName     { get; set; } = string.Empty;  
    public string     FilePath     { get; set; } = string.Empty;  
    public DateTime   SubmittedAt  { get; set; } = DateTime.Now;
    public bool       IsLate       { get; set; }
    public double?    Score        { get; set; }   
    public string?    Feedback     { get; set; }   
    public DateTime?  GradedAt     { get; set; }
    public string?     GradedBy     { get; set; } 
}