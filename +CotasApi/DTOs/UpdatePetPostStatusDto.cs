using _CotasApi.Models;
using System.ComponentModel.DataAnnotations;

namespace _CotasApi.DTOs
{
    public class UpdatePetPostStatusDto
    {
        [Required]
        public PostStatus Status { get; set; }
    }
}
