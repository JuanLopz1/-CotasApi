using System.ComponentModel.DataAnnotations;

namespace _CotasApi.Models
{
    public class User
    {
        public int UserId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; } = UserRole.User;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public ICollection<PetPost> PetPosts { get; set; } = new List<PetPost>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
