using _CotasApi.Models;
using _CotasApi.Data;
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
        public async Task<ActionResult<IEnumerable<PetPost>>> GetPetPosts()
        {
            return await _context.PetPosts.ToListAsync();
        }

        // GET: api/petposts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PetPost>> GetPetPost(int id)
        {
            var post = await _context.PetPosts.FindAsync(id);

            if (post == null)
                return NotFound();

            return post;
        }

        // POST: api/petposts
        [HttpPost]
        public async Task<ActionResult<PetPost>> CreatePetPost(PetPost post)
        {
            post.Status = PostStatus.Pending;
            post.DatePosted = DateTime.Now;

            _context.PetPosts.Add(post);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPetPost), new { id = post.PetPostId }, post);
        }

        // PUT: api/petposts/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePetPost(int id, PetPost post)
        {
            if (id != post.PetPostId)
                return BadRequest();

            _context.Entry(post).State = EntityState.Modified;

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
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] PostStatus status)
        {
            var post = await _context.PetPosts.FindAsync(id);
            if (post == null)
                return NotFound();

            post.Status = status;

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
