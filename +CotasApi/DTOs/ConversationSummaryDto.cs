namespace _CotasApi.DTOs
{
    public class ConversationSummaryDto
    {
        public int ConversationId { get; set; }
        public int PetPostId { get; set; }
        public int StarterUserId { get; set; }
        public int ReceiverUserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
