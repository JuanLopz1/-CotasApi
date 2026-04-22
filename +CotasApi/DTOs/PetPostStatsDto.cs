namespace _CotasApi.DTOs
{
    public class PetPostStatsDto
    {
        public int TotalListings { get; set; }
        public int ActiveListings { get; set; }
        public int ReunitedPets { get; set; }
        public int AdoptionListings { get; set; }
        public int LostListings { get; set; }
        public int FoundListings { get; set; }
    }
}
