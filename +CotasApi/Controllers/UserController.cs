using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using _CotasApi.Data;
using _CotasApi.Models;

namespace _CotasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly _CotasContext _context;

        public UsersController(_CotasContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }
    }
}