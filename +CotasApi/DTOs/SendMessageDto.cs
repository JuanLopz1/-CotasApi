using System.ComponentModel.DataAnnotations;

namespace _CotasApi.DTOs
{
    public class SendMessageDto
    {
        [Required]
        [StringLength(500)]
        public string Content { get; set; } = string.Empty;
    }
}
