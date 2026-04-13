using System.ComponentModel.DataAnnotations;

namespace _CotasApi.DTOs
{
    public class CreatePetPostCommentDto
    {
        [Required]
        [StringLength(80)]
        public string AuthorName { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Content { get; set; } = string.Empty;
    }
}
