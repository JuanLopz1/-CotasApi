using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _CotasApi.Migrations
{
    /// <inheritdoc />
    public partial class PetCategoryAndPublicVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PetCategory",
                table: "PetPosts",
                type: "INTEGER",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.AddColumn<string>(
                name: "PetKindLabel",
                table: "PetPosts",
                type: "TEXT",
                maxLength: 80,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PetCategory",
                table: "PetPosts");

            migrationBuilder.DropColumn(
                name: "PetKindLabel",
                table: "PetPosts");
        }
    }
}
