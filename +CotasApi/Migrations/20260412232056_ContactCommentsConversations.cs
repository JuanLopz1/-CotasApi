using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _CotasApi.Migrations
{
    /// <inheritdoc />
    public partial class ContactCommentsConversations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Conversations_PetPostId",
                table: "Conversations");

            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                table: "PetPosts",
                type: "TEXT",
                maxLength: 200,
                nullable: false,
                defaultValue: "listings@cotas.demo");

            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                table: "PetPosts",
                type: "TEXT",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PreferredContact",
                table: "PetPosts",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PetPostComments",
                columns: table => new
                {
                    PetPostCommentId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PetPostId = table.Column<int>(type: "INTEGER", nullable: false),
                    AuthorName = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Content = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PetPostComments", x => x.PetPostCommentId);
                    table.ForeignKey(
                        name: "FK_PetPostComments_PetPosts_PetPostId",
                        column: x => x.PetPostId,
                        principalTable: "PetPosts",
                        principalColumn: "PetPostId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_PetPostId_StarterUserId",
                table: "Conversations",
                columns: new[] { "PetPostId", "StarterUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PetPostComments_PetPostId",
                table: "PetPostComments",
                column: "PetPostId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PetPostComments");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_PetPostId_StarterUserId",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "ContactEmail",
                table: "PetPosts");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                table: "PetPosts");

            migrationBuilder.DropColumn(
                name: "PreferredContact",
                table: "PetPosts");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_PetPostId",
                table: "Conversations",
                column: "PetPostId");
        }
    }
}
