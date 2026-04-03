using _CotasApi.Models;
using Microsoft.EntityFrameworkCore;

namespace _CotasApi.Data
{
    public static class _CotasInitializer
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<_CotasContext>();

            try
            {
                context.Database.Migrate();

                if (!context.Users.Any())
                {
                    SeedUsers(context);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.GetBaseException().Message);
            }
        }

        private static void SeedUsers(_CotasContext context)
        {
            var users = new List<User>
            {
                new User
                {
                    Name = "Juan Lopez",
                    Email = "juan@example.com",
                    Password = "123456",
                    Role = UserRole.User,
                    CreatedAt = DateTime.Now
                },
                new User
                {
                    Name = "Admin User",
                    Email = "admin@example.com",
                    Password = "admin123",
                    Role = UserRole.Admin,
                    CreatedAt = DateTime.Now
                }
            };

            context.Users.AddRange(users);
            context.SaveChanges();
        }
    }
}