using _CotasApi.Data;
using _CotasApi.DTOs;
using _CotasApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace _CotasApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ConversationsController : ControllerBase
    {
        private readonly _CotasContext _context;

        public ConversationsController(_CotasContext context)
        {
            _context = context;
        }

        private bool IsAdmin() =>
            User.Identity?.IsAuthenticated == true && User.IsInRole(nameof(UserRole.Admin));

        private static bool IsPubliclyVisible(PetPost post) =>
            post.Status == PostStatus.Approved && !string.IsNullOrWhiteSpace(post.ImageUrl);

        private int? TryGetUserId()
        {
            var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;
            return int.TryParse(raw, out var id) ? id : null;
        }

        private static bool CanAccess(Conversation conv, int? userId, bool admin)
        {
            if (admin)
            {
                return true;
            }

            if (userId is null)
            {
                return false;
            }

            return conv.StarterUserId == userId || conv.ReceiverUserId == userId;
        }

        private static ConversationSummaryDto ToSummary(Conversation c) =>
            new()
            {
                ConversationId = c.ConversationId,
                PetPostId = c.PetPostId,
                StarterUserId = c.StarterUserId,
                ReceiverUserId = c.ReceiverUserId,
                CreatedAt = c.CreatedAt
            };

        private static MessageDto ToMessageDto(Message m) =>
            new()
            {
                MessageId = m.MessageId,
                ConversationId = m.ConversationId,
                SenderUserId = m.SenderUserId,
                SenderName = m.SenderUser?.Name ?? "User",
                Content = m.Content,
                SentAt = m.SentAt
            };

        private static string PreviewText(string? content, int maxLen = 120)
        {
            var t = content?.Trim() ?? string.Empty;
            if (t.Length <= maxLen)
            {
                return t;
            }

            return t[..maxLen].TrimEnd() + "…";
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<ConversationInboxDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<IEnumerable<ConversationInboxDto>>> GetMyConversations()
        {
            var uid = TryGetUserId();
            var admin = IsAdmin();
            if (!admin && (uid is null or <= 0))
            {
                return Unauthorized();
            }

            var query = _context.Conversations
                .AsNoTracking()
                .Include(c => c.PetPost)
                .Include(c => c.StarterUser)
                .Include(c => c.ReceiverUser)
                .AsQueryable();

            if (!admin)
            {
                query = query.Where(c => c.StarterUserId == uid || c.ReceiverUserId == uid);
            }

            var list = await query
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            if (list.Count == 0)
            {
                return Ok(Array.Empty<ConversationInboxDto>());
            }

            var ids = list.Select(c => c.ConversationId).ToList();
            var allMessages = await _context.Messages
                .AsNoTracking()
                .Where(m => ids.Contains(m.ConversationId))
                .ToListAsync();

            var lastByConv = allMessages
                .GroupBy(m => m.ConversationId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.SentAt).First());

            var result = new List<ConversationInboxDto>(list.Count);
            foreach (var c in list)
            {
                var otherName = "User";
                if (admin)
                {
                    otherName = $"{c.StarterUser?.Name ?? "User"} ↔ {c.ReceiverUser?.Name ?? "User"}";
                }
                else if (uid == c.StarterUserId)
                {
                    otherName = c.ReceiverUser?.Name ?? "Listing owner";
                }
                else if (uid == c.ReceiverUserId)
                {
                    otherName = c.StarterUser?.Name ?? "Interested person";
                }

                lastByConv.TryGetValue(c.ConversationId, out var lastMsg);

                result.Add(new ConversationInboxDto
                {
                    ConversationId = c.ConversationId,
                    PetPostId = c.PetPostId,
                    PetName = c.PetPost?.PetName ?? "Pet",
                    ListingTitle = c.PetPost?.Title ?? "",
                    OtherPartyName = otherName,
                    CreatedAt = c.CreatedAt,
                    LastMessageAt = lastMsg?.SentAt,
                    LastMessagePreview = lastMsg != null ? PreviewText(lastMsg.Content) : null
                });
            }

            result.Sort((a, b) =>
            {
                var ta = a.LastMessageAt ?? a.CreatedAt;
                var tb = b.LastMessageAt ?? b.CreatedAt;
                return tb.CompareTo(ta);
            });

            return Ok(result);
        }

        [HttpPost("start")]
        [ProducesResponseType(typeof(ConversationSummaryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ConversationSummaryDto>> StartConversation([FromBody] StartConversationDto dto)
        {
            var starterId = TryGetUserId();
            if (starterId is null or <= 0)
            {
                return Unauthorized();
            }

            var post = await _context.PetPosts.FindAsync(dto.PetPostId);
            if (post == null)
            {
                return NotFound();
            }

            if (!IsAdmin() && !IsPubliclyVisible(post))
            {
                return NotFound();
            }

            if (post.UserId == starterId.Value)
            {
                return BadRequest("You cannot start a conversation on your own listing.");
            }

            var existing = await _context.Conversations
                .AsNoTracking()
                .FirstOrDefaultAsync(c =>
                    c.PetPostId == dto.PetPostId && c.StarterUserId == starterId.Value);

            if (existing != null)
            {
                return Ok(ToSummary(existing));
            }

            var conv = new Conversation
            {
                PetPostId = post.PetPostId,
                StarterUserId = starterId.Value,
                ReceiverUserId = post.UserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Conversations.Add(conv);
            await _context.SaveChangesAsync();

            return Ok(ToSummary(conv));
        }

        [HttpGet("{id:int}/messages")]
        [ProducesResponseType(typeof(IEnumerable<MessageDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessages(int id)
        {
            var uid = TryGetUserId();
            var admin = IsAdmin();

            var conv = await _context.Conversations.AsNoTracking().FirstOrDefaultAsync(c => c.ConversationId == id);
            if (conv == null)
            {
                return NotFound();
            }

            if (!CanAccess(conv, uid, admin))
            {
                return Forbid();
            }

            var messages = await _context.Messages
                .AsNoTracking()
                .Include(m => m.SenderUser)
                .Where(m => m.ConversationId == id)
                .OrderBy(m => m.SentAt)
                .ToListAsync();

            return Ok(messages.Select(ToMessageDto).ToList());
        }

        [HttpPost("{id:int}/messages")]
        [ProducesResponseType(typeof(MessageDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<MessageDto>> SendMessage(int id, [FromBody] SendMessageDto dto)
        {
            var uid = TryGetUserId();
            if (uid is null or <= 0)
            {
                return Unauthorized();
            }

            var admin = IsAdmin();
            var conv = await _context.Conversations.FindAsync(id);
            if (conv == null)
            {
                return NotFound();
            }

            if (!CanAccess(conv, uid, admin))
            {
                return Forbid();
            }

            var text = dto.Content?.Trim() ?? string.Empty;
            if (text.Length == 0)
            {
                return BadRequest("Message cannot be empty.");
            }

            var msg = new Message
            {
                ConversationId = id,
                SenderUserId = uid.Value,
                Content = text,
                SentAt = DateTime.UtcNow
            };

            _context.Messages.Add(msg);
            await _context.SaveChangesAsync();

            await _context.Entry(msg).Reference(m => m.SenderUser).LoadAsync();

            return Ok(ToMessageDto(msg));
        }
    }
}
