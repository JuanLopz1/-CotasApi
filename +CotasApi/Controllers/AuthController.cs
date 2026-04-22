using _CotasApi.Data;
using _CotasApi.DTOs;
using _CotasApi.Models;
using _CotasApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace _CotasApi.Controllers
{
    /// <summary>Routes: POST api/auth/login, POST api/auth/register (lowercase URL works everywhere).</summary>
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly _CotasContext _context;
        private readonly JwtTokenService _jwtTokenService;

        public AuthController(_CotasContext context, JwtTokenService jwtTokenService)
        {
            _context = context;
            _jwtTokenService = jwtTokenService;
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginRequestDto loginDto)
        {
            var user = await _context.Users
                .SingleOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || user.Password != loginDto.Password)
            {
                return Unauthorized("Invalid email or password.");
            }

            var loginResponse = _jwtTokenService.CreateLoginResponse(user);
            return Ok(loginResponse);
        }

        [HttpPost("register")]
        [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<LoginResponseDto>> Register(RegisterRequestDto dto)
        {
            var email = dto.Email.Trim();
            var name = dto.Name.Trim();

            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email))
            {
                return BadRequest("Name and email are required.");
            }

            var emailTaken = await _context.Users.AnyAsync(u =>
                u.Email.ToLower() == email.ToLower());

            if (emailTaken)
            {
                return BadRequest("That email is already registered.");
            }

            var user = new User
            {
                Name = name,
                Email = email,
                Password = dto.Password,
                Role = UserRole.User,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var loginResponse = _jwtTokenService.CreateLoginResponse(user);
            return Ok(loginResponse);
        }
    }
}
