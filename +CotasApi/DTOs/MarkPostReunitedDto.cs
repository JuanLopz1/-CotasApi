using System.ComponentModel.DataAnnotations;

namespace _CotasApi.DTOs
{
    public class MarkPostReunitedDto
    {
        [Required]
        [StringLength(500, MinimumLength = 6)]
        public string Details { get; set; } = string.Empty;
    }
}
