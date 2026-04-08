using _CotasApi.DTOs;
using _CotasApi.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace _CotasApi.Services
{
    public class JwtTokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public LoginResponseDto CreateLoginResponse(User user)
        {
            var issuer = _configuration["JwtSettings:Issuer"] ?? string.Empty;
            var audience = _configuration["JwtSettings:Audience"] ?? string.Empty;
            var secretKey = _configuration["JwtSettings:SecretKey"] ?? string.Empty;

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var expiresAtUtc = DateTime.UtcNow.AddHours(2);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new(JwtRegisteredClaimNames.Email, user.Email),
                new(ClaimTypes.Name, user.Name),
                new(ClaimTypes.Role, user.Role.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiresAtUtc,
                signingCredentials: credentials
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);

            return new LoginResponseDto
            {
                Token = jwt,
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.ToString(),
                ExpiresAtUtc = expiresAtUtc
            };
        }
    }
}
