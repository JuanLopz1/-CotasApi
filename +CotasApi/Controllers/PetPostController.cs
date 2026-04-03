using _CotasApi.Models;
using _CotasApi.Data;
using _CotasApi.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace _CotasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PetPostsController : ControllerBase
    {
        private readonly _CotasContext _context;

        public PetPostsController(_CotasContext context)
        {
            _context = context;
        }

        // GET: api/petposts
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<PetPostDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<PetPostDto>>> GetPetPosts(
            [FromQuery] PostStatus? status,
            [FromQuery] PostType? postType)
        {
            IQueryable<PetPost> query = _context.PetPosts;

            if (status.HasValue)
                query = query.Where(p => p.Status == status.Value);

            if (postType.HasValue)
                query = query.Where(p => p.PostType == postType.Value);

            var posts = await query.ToListAsync();
            return posts.Select(ToDto).ToList();
        }

        // GET: api/petposts/5
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(PetPostDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PetPostDto>> GetPetPost(int id)
        {
            var post = await _context.PetPosts.FindAsync(id);

            if (post == null)
                return NotFound();

            return ToDto(post);
        }

        // POST: api/petposts
        [HttpPost]
        [ProducesResponseType(typeof(PetPostDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PetPostDto>> CreatePetPost(CreatePetPostDto createDto)
        {
            var userExists = await _context.Users.AnyAsync(u => u.UserId == createDto.UserId);
            if (!userExists)
            {
                return BadRequest("The specified user does not exist.");
            }

            var post = new PetPost
            {
                Title = createDto.Title,
                PetName = createDto.PetName,
                PostType = createDto.PostType,
                Description = createDto.Description,
                Location = createDto.Location,
                UserId = createDto.UserId
            };

            post.Status = PostStatus.Pending;
            post.DatePosted = DateTime.Now;

            _context.PetPosts.Add(post);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPetPost), new { id = post.PetPostId }, ToDto(post));
        }

        // PUT: api/petposts/5
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdatePetPost(int id, UpdatePetPostDto updateDto)
        {
            var existingPost = await _context.PetPosts.FindAsync(id);
            if (existingPost == null)
                return NotFound();

            existingPost.Title = updateDto.Title;
            existingPost.PetName = updateDto.PetName;
            existingPost.PostType = updateDto.PostType;
            existingPost.Description = updateDto.Description;
            existingPost.Location = updateDto.Location;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.PetPosts.Any(e => e.PetPostId == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // DELETE: api/petposts/5
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeletePetPost(int id)
        {
            var post = await _context.PetPosts.FindAsync(id);
            if (post == null)
                return NotFound();

            _context.PetPosts.Remove(post);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/petposts/5/status
        [HttpPut("{id}/status")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateStatus(int id, UpdatePetPostStatusDto updateStatusDto)
        {
            var post = await _context.PetPosts.FindAsync(id);
            if (post == null)
                return NotFound();

            post.Status = updateStatusDto.Status;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static PetPostDto ToDto(PetPost post)
        {
            return new PetPostDto
            {
                PetPostId = post.PetPostId,
                Title = post.Title,
                PetName = post.PetName,
                PostType = post.PostType,
                Description = post.Description,
                Location = post.Location,
                Status = post.Status,
                DatePosted = post.DatePosted,
                UserId = post.UserId
            };
        }
    }
}
