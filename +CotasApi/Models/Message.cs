using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace _CotasApi.Models
{
    public class Message
    {
        public int MessageId { get; set; }

        [ForeignKey("Conversation")]
        public int ConversationId { get; set; }
        public Conversation? Conversation { get; set; }

        [ForeignKey("SenderUser")]
        public int SenderUserId { get; set; }
        public User? SenderUser { get; set; }

        [Required]
        [StringLength(500)]
        public string Content { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.Now;
    }
}
