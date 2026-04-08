namespace _CotasApi.DTOs
{
    public class ToggleLikeResponseDto
    {
        public int PetPostId { get; set; }
        public int LikesCount { get; set; }
        public bool IsLiked { get; set; }
    }
}
