using _CotasApi.Data;
using _CotasApi.DTOs;
using _CotasApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace _CotasApi.Controllers
{
    [ApiController]
    public class PetPostCommentsController : ControllerBase
    {
        private readonly _CotasContext _context;

        public PetPostCommentsController(_CotasContext context)
        {
            _context = context;
        }

        private bool IsAdmin() =>
            User.Identity?.IsAuthenticated == true && User.IsInRole(nameof(UserRole.Admin));

        private static bool IsPubliclyVisible(PetPost post) =>
            post.Status == PostStatus.Approved && !string.IsNullOrWhiteSpace(post.ImageUrl);

        private async Task<PetPost?> GetPostIfVisibleAsync(int petPostId)
        {
            var post = await _context.PetPosts.SingleOrDefaultAsync(p => p.PetPostId == petPostId);
            if (post == null)
            {
                return null;
            }

            if (!IsAdmin() && !IsPubliclyVisible(post))
            {
                return null;
            }

            return post;
        }

        [HttpGet("/api/petposts/{petPostId:int}/comments")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<PetPostCommentDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IEnumerable<PetPostCommentDto>>> GetComments(int petPostId)
        {
            var post = await GetPostIfVisibleAsync(petPostId);
            if (post == null)
            {
                return NotFound();
            }

            var rows = await _context.PetPostComments
                .Where(c => c.PetPostId == petPostId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new PetPostCommentDto
                {
                    PetPostCommentId = c.PetPostCommentId,
                    PetPostId = c.PetPostId,
                    AuthorName = c.AuthorName,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(rows);
        }

        [HttpPost("/api/petposts/{petPostId:int}/comments")]
        [Authorize]
        [ProducesResponseType(typeof(PetPostCommentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PetPostCommentDto>> AddComment(int petPostId, CreatePetPostCommentDto dto)
        {
            var post = await GetPostIfVisibleAsync(petPostId);
            if (post == null)
            {
                return NotFound();
            }

            var comment = new PetPostComment
            {
                PetPostId = petPostId,
                AuthorName = dto.AuthorName.Trim(),
                Content = dto.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.PetPostComments.Add(comment);
            await _context.SaveChangesAsync();

            var result = new PetPostCommentDto
            {
                PetPostCommentId = comment.PetPostCommentId,
                PetPostId = comment.PetPostId,
                AuthorName = comment.AuthorName,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt
            };

            return Ok(result);
        }

        [HttpDelete("/api/petposts/{petPostId:int}/comments/{commentId:int}")]
        [Authorize(Roles = nameof(UserRole.Admin))]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DeleteComment(int petPostId, int commentId)
        {
            if (!IsAdmin())
            {
                return Forbid();
            }

            var postExists = await _context.PetPosts.AnyAsync(p => p.PetPostId == petPostId);
            if (!postExists)
            {
                return NotFound();
            }

            var comment = await _context.PetPostComments.FirstOrDefaultAsync(c =>
                c.PetPostCommentId == commentId && c.PetPostId == petPostId);

            if (comment == null)
            {
                return NotFound();
            }

            _context.PetPostComments.Remove(comment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
