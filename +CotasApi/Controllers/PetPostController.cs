using _CotasApi.Models;
using _CotasApi.Data;
using _CotasApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace _CotasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PetPostsController : ControllerBase
    {
        private readonly _CotasContext _context;
        private readonly IWebHostEnvironment _env;

        public PetPostsController(_CotasContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        private bool IsAdmin() =>
            User.Identity?.IsAuthenticated == true && User.IsInRole(nameof(UserRole.Admin));

        private int? CurrentUserId()
        {
            var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;
            return int.TryParse(raw, out var value) && value > 0 ? value : null;
        }

        private static bool IsPubliclyVisible(PetPost post) =>
            post.Status == PostStatus.Approved && !string.IsNullOrWhiteSpace(post.ImageUrl);

        // GET: api/petposts
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<PetPostDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<PetPostDto>>> GetPetPosts(
            [FromQuery] PostStatus? status,
            [FromQuery] PostType? postType,
            [FromQuery] bool includeReunited = false,
            [FromQuery] string? clientId = null)
        {
            IQueryable<PetPost> query = _context.PetPosts
                .Include(p => p.Likes);

            if (includeReunited)
            {
                if (!IsAdmin())
                {
                    return Forbid();
                }

                query = query.Where(p => p.Status == PostStatus.Reunited);
            }
            else
            {
                query = query.Where(p => p.Status != PostStatus.Reunited);
            }

            if (!IsAdmin())
            {
                // Inline predicate — EF Core cannot translate a custom method call to SQL.
                query = query.Where(p =>
                    p.Status == PostStatus.Approved &&
                    p.ImageUrl != null &&
                    p.ImageUrl != "");
            }

            if (status.HasValue)
                query = query.Where(p => p.Status == status.Value);

            if (postType.HasValue)
                query = query.Where(p => p.PostType == postType.Value);

            var posts = await query.ToListAsync();
            return posts.Select(post => ToDto(post, clientId)).ToList();
        }

        // GET: api/petposts/stats
        [HttpGet("stats")]
        [ProducesResponseType(typeof(PetPostStatsDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<PetPostStatsDto>> GetStats()
        {
            var total = await _context.PetPosts.CountAsync();
            var reunited = await _context.PetPosts.CountAsync(p => p.Status == PostStatus.Reunited);
            var active = await _context.PetPosts.CountAsync(p =>
                p.Status == PostStatus.Approved &&
                p.ImageUrl != null &&
                p.ImageUrl != "");
            var adoption = await _context.PetPosts.CountAsync(p => p.PostType == PostType.Adoption);
            var lost = await _context.PetPosts.CountAsync(p => p.PostType == PostType.Lost);
            var found = await _context.PetPosts.CountAsync(p => p.PostType == PostType.Found);

            return Ok(new PetPostStatsDto
            {
                TotalListings = total,
                ActiveListings = active,
                ReunitedPets = reunited,
                AdoptionListings = adoption,
                LostListings = lost,
                FoundListings = found
            });
        }

        // GET: api/petposts/mine
        [HttpGet("mine")]
        [Authorize]
        [ProducesResponseType(typeof(IEnumerable<PetPostDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<IEnumerable<PetPostDto>>> GetMyPetPosts([FromQuery] string? clientId)
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (!int.TryParse(idClaim, out var userId) || userId <= 0)
            {
                return Unauthorized();
            }

            var exists = await _context.Users.AnyAsync(u => u.UserId == userId);
            if (!exists)
            {
                return Unauthorized();
            }

            var posts = await _context.PetPosts
                .AsNoTracking()
                .Include(p => p.Likes)
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.DatePosted)
                .ToListAsync();

            return Ok(posts.Select(p => ToDto(p, clientId)).ToList());
        }

        // GET: api/petposts/5
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(PetPostDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PetPostDto>> GetPetPost(int id, [FromQuery] string? clientId)
        {
            var post = await _context.PetPosts
                .Include(p => p.Likes)
                .SingleOrDefaultAsync(p => p.PetPostId == id);

            if (post == null)
                return NotFound();

            var currentUserId = CurrentUserId();
            var isOwner = currentUserId.HasValue && currentUserId.Value == post.UserId;
            if (!IsAdmin() && !isOwner && !IsPubliclyVisible(post))
                return NotFound();

            return ToDto(post, clientId);
        }

        // POST: api/petposts
        [HttpPost]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(PetPostDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PetPostDto>> CreatePetPost([FromForm] CreatePetPostDto createDto)
        {
            if (createDto.ImageFile is not { Length: > 0 })
            {
                return BadRequest("An image file is required (PNG, JPG, or other common image formats).");
            }

            var userId = await ResolveAuthorUserIdAsync();
            if (userId <= 0)
            {
                return BadRequest("Could not resolve an author user for this post.");
            }

            var kindLabel = string.IsNullOrWhiteSpace(createDto.PetKindLabel)
                ? null
                : createDto.PetKindLabel.Trim();

            string imageUrl;
            try
            {
                imageUrl = await SaveUploadedImageAsync(createDto.ImageFile);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }

            var post = new PetPost
            {
                Title = createDto.Title,
                PetName = createDto.PetName,
                PetCategory = createDto.PetCategory,
                PetKindLabel = kindLabel,
                PostType = createDto.PostType,
                Description = createDto.Description,
                Location = createDto.Location,
                ContactEmail = createDto.ContactEmail.Trim(),
                ContactPhone = string.IsNullOrWhiteSpace(createDto.ContactPhone)
                    ? null
                    : createDto.ContactPhone.Trim(),
                PreferredContact = createDto.PreferredContact,
                UserId = userId,
                ImageUrl = imageUrl
            };

            post.Status = PostStatus.Pending;
            post.DatePosted = DateTime.Now;

            _context.PetPosts.Add(post);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPetPost), new { id = post.PetPostId }, ToDto(post, null));
        }

        // PUT: api/petposts/5
        [HttpPut("{id}")]
        [Authorize]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdatePetPost(int id, [FromForm] UpdatePetPostFormDto dto)
        {
            var existingPost = await _context.PetPosts.FindAsync(id);
            if (existingPost == null)
                return NotFound();

            var currentUserId = CurrentUserId();
            if (!IsAdmin() && currentUserId != existingPost.UserId)
            {
                return Forbid();
            }

            existingPost.Title = dto.Title;
            existingPost.PetName = dto.PetName;
            existingPost.PostType = dto.PostType;
            existingPost.PetCategory = dto.PetCategory;
            existingPost.PetKindLabel = string.IsNullOrWhiteSpace(dto.PetKindLabel)
                ? null
                : dto.PetKindLabel.Trim();
            existingPost.Description = dto.Description;
            existingPost.Location = dto.Location;
            existingPost.ContactEmail = dto.ContactEmail.Trim();
            existingPost.ContactPhone = string.IsNullOrWhiteSpace(dto.ContactPhone)
                ? null
                : dto.ContactPhone.Trim();
            existingPost.PreferredContact = dto.PreferredContact;

            if (dto.ClearImage)
            {
                existingPost.ImageUrl = null;
            }
            else if (dto.ImageFile is { Length: > 0 })
            {
                try
                {
                    existingPost.ImageUrl = await SaveUploadedImageAsync(dto.ImageFile);
                }
                catch (InvalidOperationException ex)
                {
                    return BadRequest(ex.Message);
                }
            }

            if (dto.Status.HasValue)
            {
                existingPost.Status = dto.Status.Value;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.PetPosts.Any(e => e.PetPostId == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        // PUT: api/petposts/5/like
        [HttpPut("{id}/like")]
        [ProducesResponseType(typeof(ToggleLikeResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ToggleLikeResponseDto>> ToggleLike(int id, ToggleLikeRequestDto request)
        {
            var normalizedClientId = request.ClientId.Trim();
            if (normalizedClientId.Length == 0)
            {
                return BadRequest("ClientId is required.");
            }

            var post = await _context.PetPosts
                .Include(p => p.Likes)
                .SingleOrDefaultAsync(p => p.PetPostId == id);

            if (post == null)
            {
                return NotFound();
            }

            if (!IsAdmin() && !IsPubliclyVisible(post))
            {
                return NotFound();
            }

            if (post.PostType != PostType.Adoption)
            {
                return BadRequest("Only adoption posts can be liked.");
            }

            var existingLike = post.Likes.SingleOrDefault(l => l.ClientId == normalizedClientId);
            var isLiked = existingLike == null;

            if (existingLike == null)
            {
                post.Likes.Add(new PetPostLike
                {
                    ClientId = normalizedClientId,
                    PetPostId = post.PetPostId
                });
            }
            else
            {
                _context.PetPostLikes.Remove(existingLike);
            }

            await _context.SaveChangesAsync();

            var likesCount = await _context.PetPostLikes.CountAsync(l => l.PetPostId == post.PetPostId);
            return Ok(new ToggleLikeResponseDto
            {
                PetPostId = post.PetPostId,
                LikesCount = likesCount,
                IsLiked = isLiked
            });
        }

        // PUT: api/petposts/5/reunited
        [HttpPut("{id}/reunited")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> MarkAsReunited(int id, MarkPostReunitedDto dto)
        {
            var post = await _context.PetPosts.FindAsync(id);
            if (post == null)
            {
                return NotFound();
            }

            var currentUserId = CurrentUserId();
            var isOwner = currentUserId.HasValue && currentUserId.Value == post.UserId;
            if (!IsAdmin() && !isOwner)
            {
                return Forbid();
            }

            post.Status = PostStatus.Reunited;
            post.ReunionDetails = dto.Details.Trim();
            post.ReunionAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/petposts/5
        [HttpDelete("{id}")]
        [Authorize(Roles = nameof(UserRole.Admin))]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
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
        [Authorize(Roles = nameof(UserRole.Admin))]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
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

        private static PetPostDto ToDto(PetPost post, string? clientId)
        {
            var normalizedClientId = string.IsNullOrWhiteSpace(clientId) ? null : clientId.Trim();
            return new PetPostDto
            {
                PetPostId = post.PetPostId,
                Title = post.Title,
                PetName = post.PetName,
                PetCategory = post.PetCategory,
                PetKindLabel = post.PetKindLabel,
                PostType = post.PostType,
                Description = post.Description,
                Location = post.Location,
                ContactEmail = post.ContactEmail,
                ContactPhone = post.ContactPhone,
                PreferredContact = post.PreferredContact,
                ImageUrl = post.ImageUrl,
                Status = post.Status,
                ReunionDetails = post.ReunionDetails,
                ReunionAt = post.ReunionAt,
                DatePosted = post.DatePosted,
                UserId = post.UserId,
                LikesCount = post.Likes.Count,
                IsLikedByCurrentUser = normalizedClientId != null &&
                    post.Likes.Any(l => l.ClientId == normalizedClientId)
            };
        }

        private async Task<int> ResolveAuthorUserIdAsync()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value;

                if (int.TryParse(idClaim, out var claimUserId))
                {
                    var exists = await _context.Users.AnyAsync(u => u.UserId == claimUserId);
                    if (exists)
                    {
                        return claimUserId;
                    }
                }
            }

            const string guestEmail = "guest@cotas.local";
            var guest = await _context.Users
                .OrderBy(u => u.UserId)
                .FirstOrDefaultAsync(u => u.Email == guestEmail);

            if (guest != null)
            {
                return guest.UserId;
            }

            guest = new User
            {
                Name = "Guest User",
                Email = guestEmail,
                Password = "guest",
                Role = UserRole.User,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(guest);
            await _context.SaveChangesAsync();
            return guest.UserId;
        }

        private async Task<string> SaveUploadedImageAsync(IFormFile imageFile)
        {
            var extension = Path.GetExtension(imageFile.FileName);
            var safeExtension = string.IsNullOrWhiteSpace(extension) ? ".jpg" : extension.ToLowerInvariant();
            var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp", ".jfif", ".heic"
            };

            if (!allowed.Contains(safeExtension))
            {
                throw new InvalidOperationException($"Unsupported image extension: {safeExtension}");
            }

            var ct = imageFile.ContentType ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(ct) &&
                !ct.StartsWith("image/", StringComparison.OrdinalIgnoreCase) &&
                !ct.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Uploaded file must be an image.");
            }

            var fileName = $"{Guid.NewGuid():N}{safeExtension}";
            var uploadsFolder = Path.Combine(_env.ContentRootPath, "img", "uploads");
            Directory.CreateDirectory(uploadsFolder);
            var destinationPath = Path.Combine(uploadsFolder, fileName);

            await using var stream = System.IO.File.Create(destinationPath);
            await imageFile.CopyToAsync(stream);

            return $"/img/uploads/{fileName}";
        }
    }
}
