using System.ComponentModel.DataAnnotations.Schema;

namespace _CotasApi.Models
{
    public class Conversation
    {
        public int ConversationId { get; set; }

        [ForeignKey("PetPost")]
        public int PetPostId { get; set; }
        public PetPost? PetPost { get; set; }

        [ForeignKey("StarterUser")]
        public int StarterUserId { get; set; }
        public User? StarterUser { get; set; }

        [ForeignKey("ReceiverUser")]
        public int ReceiverUserId { get; set; }
        public User? ReceiverUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
