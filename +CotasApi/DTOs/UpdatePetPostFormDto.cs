using _CotasApi.Models;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace _CotasApi.DTOs
{
    public class UpdatePetPostFormDto
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
        public PetCategory PetCategory { get; set; }

        [StringLength(80)]
        public string? PetKindLabel { get; set; }

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Location { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(200)]
        public string ContactEmail { get; set; } = string.Empty;

        [StringLength(40)]
        public string? ContactPhone { get; set; }

        public PreferredContactMethod? PreferredContact { get; set; }

        [StringLength(260)]
        public string? ImageUrl { get; set; }

        public IFormFile? ImageFile { get; set; }

        public bool ClearImage { get; set; }

        public PostStatus? Status { get; set; }
    }
}
