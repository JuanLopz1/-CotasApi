using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _CotasApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPetImagesLikesAndGuest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "PetPosts",
                type: "TEXT",
                maxLength: 260,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PetPostLikes",
                columns: table => new
                {
                    PetPostLikeId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PetPostId = table.Column<int>(type: "INTEGER", nullable: false),
                    ClientId = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PetPostLikes", x => x.PetPostLikeId);
                    table.ForeignKey(
                        name: "FK_PetPostLikes_PetPosts_PetPostId",
                        column: x => x.PetPostId,
                        principalTable: "PetPosts",
                        principalColumn: "PetPostId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PetPostLikes_PetPostId_ClientId",
                table: "PetPostLikes",
                columns: new[] { "PetPostId", "ClientId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PetPostLikes");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "PetPosts");
        }
    }
}
