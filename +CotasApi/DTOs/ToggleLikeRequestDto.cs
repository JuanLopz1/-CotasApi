using System.ComponentModel.DataAnnotations;

namespace _CotasApi.DTOs
{
    public class ToggleLikeRequestDto
    {
        [Required]
        [StringLength(120)]
        public string ClientId { get; set; } = string.Empty;
    }
}
