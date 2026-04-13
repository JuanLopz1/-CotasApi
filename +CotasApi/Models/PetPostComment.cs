using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace _CotasApi.Models
{
    public class PetPostComment
    {
        public int PetPostCommentId { get; set; }

        [ForeignKey("PetPost")]
        public int PetPostId { get; set; }
        public PetPost? PetPost { get; set; }

        [Required]
        [StringLength(80)]
        public string AuthorName { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
