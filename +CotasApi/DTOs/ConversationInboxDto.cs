namespace _CotasApi.DTOs
{
    public class ConversationInboxDto
    {
        public int ConversationId { get; set; }
        public int PetPostId { get; set; }
        public string PetName { get; set; } = "";
        public string ListingTitle { get; set; } = "";
        public string OtherPartyName { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public DateTime? LastMessageAt { get; set; }
        public string? LastMessagePreview { get; set; }
    }
}
