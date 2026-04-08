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

                EnsureGuestUser(context);
                EnsureAdminUser(context);
                RemoveLogoPosts(context);
                SeedPetPostsFromImageFolder(context);
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

        private static void EnsureGuestUser(_CotasContext context)
        {
            const string guestEmail = "guest@cotas.local";
            var guestExists = context.Users.Any(u => u.Email == guestEmail);
            if (guestExists)
            {
                return;
            }

            context.Users.Add(new User
            {
                Name = "Guest User",
                Email = guestEmail,
                Password = "guest",
                Role = UserRole.User,
                CreatedAt = DateTime.Now
            });

            context.SaveChanges();
        }

        private static void EnsureAdminUser(_CotasContext context)
        {
            const string adminEmail = "admin@example.com";
            var adminUser = context.Users.SingleOrDefault(u => u.Email == adminEmail);

            if (adminUser == null)
            {
                context.Users.Add(new User
                {
                    Name = "Admin User",
                    Email = adminEmail,
                    Password = "admin123",
                    Role = UserRole.Admin,
                    CreatedAt = DateTime.Now
                });

                context.SaveChanges();
                return;
            }

            adminUser.Name = "Admin User";
            adminUser.Password = "admin123";
            adminUser.Role = UserRole.Admin;
            context.SaveChanges();
        }

        private static void SeedPetPostsFromImageFolder(_CotasContext context)
        {
            var imageDirectory = Path.Combine(Directory.GetCurrentDirectory(), "img");
            if (!Directory.Exists(imageDirectory))
            {
                return;
            }

            var guestUser = context.Users.FirstOrDefault(u => u.Email == "guest@cotas.local");
            if (guestUser == null)
            {
                return;
            }

            var imageFiles = Directory
                .EnumerateFiles(imageDirectory, "*.*", SearchOption.AllDirectories)
                .Where(path =>
                {
                    var ext = Path.GetExtension(path).ToLowerInvariant();
                    return ext is ".png" or ".jpg" or ".jpeg" or ".webp" or ".gif" or ".avif" or ".bmp" or ".jfif" or ".heic";
                })
                .Where(path => !IsLogoImagePath(path))
                .ToList();

            var seeded = 0;
            var today = DateTime.Now;

            foreach (var imageFile in imageFiles)
            {
                var relative = Path.GetRelativePath(imageDirectory, imageFile).Replace("\\", "/");
                var imageUrl = $"/img/{relative}";

                var alreadyExists = context.PetPosts.Any(p => p.ImageUrl == imageUrl);
                if (alreadyExists)
                {
                    continue;
                }

                var petName = BuildPetNameFromFileName(Path.GetFileNameWithoutExtension(imageFile));
                var postType = PickPostTypeByIndex(seeded);

                context.PetPosts.Add(new PetPost
                {
                    Title = BuildTitle(postType, petName),
                    PetName = petName,
                    PostType = postType,
                    Description = BuildDescription(postType, petName),
                    Location = BuildLocation(seeded),
                    ImageUrl = imageUrl,
                    Status = PostStatus.Approved,
                    DatePosted = today.AddDays(-seeded),
                    UserId = guestUser.UserId
                });

                seeded++;
            }

            if (seeded > 0)
            {
                context.SaveChanges();
            }
        }

        private static void RemoveLogoPosts(_CotasContext context)
        {
            var logoPosts = context.PetPosts
                .Where(p =>
                    (p.ImageUrl != null && p.ImageUrl.ToLower().Contains("logo")) ||
                    p.PetName.ToLower().Contains("logo") ||
                    p.Title.ToLower().Contains("logo"))
                .ToList();

            if (logoPosts.Count == 0)
            {
                return;
            }

            context.PetPosts.RemoveRange(logoPosts);
            context.SaveChanges();
        }

        private static bool IsLogoImagePath(string path)
        {
            var fileName = Path.GetFileNameWithoutExtension(path);
            return fileName.Contains("logo", StringComparison.OrdinalIgnoreCase);
        }

        private static string BuildPetNameFromFileName(string fileName)
        {
            var words = fileName
                .Replace("_", " ")
                .Replace("-", " ")
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Select(word => char.ToUpper(word[0]) + word[1..].ToLowerInvariant());

            var result = string.Join(' ', words);
            return string.IsNullOrWhiteSpace(result) ? "Unknown Pet" : result;
        }

        private static PostType PickPostTypeByIndex(int index)
        {
            var value = index % 3;
            return value switch
            {
                1 => PostType.Lost,
                2 => PostType.Found,
                _ => PostType.Adoption
            };
        }

        private static string BuildTitle(PostType postType, string petName)
        {
            return postType switch
            {
                PostType.Adoption => $"{petName} is ready for adoption",
                PostType.Lost => $"Lost: {petName}",
                PostType.Found => $"Found pet: {petName}",
                _ => petName
            };
        }

        private static string BuildDescription(PostType postType, string petName)
        {
            return postType switch
            {
                PostType.Adoption => $"{petName} is friendly, healthy, and waiting for a loving family.",
                PostType.Lost => $"{petName} was last seen nearby. Please contact us if you have any information.",
                PostType.Found => $"{petName} was found safe and is waiting to be reunited with the family.",
                _ => $"{petName} post"
            };
        }

        private static string BuildLocation(int index)
        {
            var cities = new[]
            {
                "Santo Domingo",
                "Santiago",
                "La Vega",
                "San Cristobal",
                "Puerto Plata",
                "Bavaro"
            };

            return cities[index % cities.Length];
        }
    }
}