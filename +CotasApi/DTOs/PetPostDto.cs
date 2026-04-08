using _CotasApi.Models;

namespace _CotasApi.DTOs
{
    public class PetPostDto
    {
        public int PetPostId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string PetName { get; set; } = string.Empty;
        public PostType PostType { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public PostStatus Status { get; set; }
        public DateTime DatePosted { get; set; }
        public int UserId { get; set; }
        public int LikesCount { get; set; }
        public bool IsLikedByCurrentUser { get; set; }
    }
}
