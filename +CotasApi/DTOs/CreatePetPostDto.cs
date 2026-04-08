using _CotasApi.Models;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace _CotasApi.DTOs
{
    public class CreatePetPostDto
    {
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
        [StringLength(260)]
        public string? ImageUrl { get; set; }
        public IFormFile? ImageFile { get; set; }
    }
}
