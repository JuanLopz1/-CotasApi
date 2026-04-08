using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace _CotasApi.Models
{
    public class PetPostLike
    {
        public int PetPostLikeId { get; set; }

        [Required]
        public int PetPostId { get; set; }

        [Required]
        [StringLength(120)]
        public string ClientId { get; set; } = string.Empty;

        [ForeignKey(nameof(PetPostId))]
        public PetPost? PetPost { get; set; }
    }
}
