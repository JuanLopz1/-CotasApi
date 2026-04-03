using Microsoft.VisualBasic;
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
        public PostType PostType { get; set; }

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Location { get; set; } = string.Empty;

        [Required]
        public PostStatus Status { get; set; } = PostStatus.Pending;

        public DateTime DatePosted { get; set; } = DateTime.Now;

        [ForeignKey("User")]
        public int UserId { get; set; }

        public User? User { get; set; }

        public ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
    }
}
