using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _CotasApi.Migrations
{
    /// <inheritdoc />
    public partial class AddReunionColumnsFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReunionAt",
                table: "PetPosts",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReunionDetails",
                table: "PetPosts",
                type: "TEXT",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReunionAt",
                table: "PetPosts");

            migrationBuilder.DropColumn(
                name: "ReunionDetails",
                table: "PetPosts");
        }
    }
}
