namespace _CotasApi.DTOs
{
    public class PetPostCommentDto
    {
        public int PetPostCommentId { get; set; }
        public int PetPostId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
