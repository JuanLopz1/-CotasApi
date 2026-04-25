using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace _CotasApi.Models
{
    public class PetPost
    {
        public int PetPostId { get; set; }

        [Required]
        [StringLength(120)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string PetName { get; set; } = string.Empty;

        [Required]
        public PetCategory PetCategory { get; set; } = PetCategory.Others;

        [StringLength(80)]
        public string? PetKindLabel { get; set; }

        [Required]
        public PostType PostType { get; set; }

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Location { get; set; } = string.Empty;

        /// <summary>
        /// Public URL path for the listing photo, set only by the server (upload handler or local seed under /img/...).
        /// Clients do not send this column; use multipart file upload on create/update.
        /// </summary>
        [StringLength(260)]
        public string? ImageUrl { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(200)]
        public string ContactEmail { get; set; } = string.Empty;

        [StringLength(40)]
        public string? ContactPhone { get; set; }

        public PreferredContactMethod? PreferredContact { get; set; }

        [Required]
        public PostStatus Status { get; set; } = PostStatus.Pending;

        [StringLength(500)]
        public string? ReunionDetails { get; set; }

        public DateTime? ReunionAt { get; set; }

        public DateTime DatePosted { get; set; } = DateTime.Now;

        [ForeignKey("User")]
        public int UserId { get; set; }

        public User? User { get; set; }

        public ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
        public ICollection<PetPostLike> Likes { get; set; } = new List<PetPostLike>();
        public ICollection<PetPostComment> Comments { get; set; } = new List<PetPostComment>();
    }
}
