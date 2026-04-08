using _CotasApi.Data;
using _CotasApi.DTOs;
using _CotasApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace _CotasApi.Controllers
{
    [Route("api/[controller]")]
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
    }
}
