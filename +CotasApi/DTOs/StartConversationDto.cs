using System.ComponentModel.DataAnnotations;

namespace _CotasApi.DTOs
{
    public class StartConversationDto
    {
        [Required]
        public int PetPostId { get; set; }
    }
}
