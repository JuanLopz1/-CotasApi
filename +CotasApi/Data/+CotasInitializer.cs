using _CotasApi.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace _CotasApi.Data
{
    public static class _CotasInitializer
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<_CotasContext>();
            var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();

            try
            {
                context.Database.Migrate();

                if (!context.Users.Any())
                {
                    SeedUsers(context);
                }

                EnsureGuestUser(context);
                EnsureAdminUser(context);
                EnsureStaffAdminUser(context);
                RemoveLogoPosts(context);
                RemoveCommunityPetPlaceholderPosts(context);
                SeedPetPostsFromImageFolder(context, env);
                // Temporarily disabled for Azure fallback flow; re-enable when local /img publishing is stable.
                // ClearMissingLocalImageUrls(context, env);
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

        /// <summary>School/demo staff admin (JWT login).</summary>
        private static void EnsureStaffAdminUser(_CotasContext context)
        {
            const string email = "jdlopz10@gmail.com";
            var user = context.Users.SingleOrDefault(u => u.Email == email);

            if (user == null)
            {
                context.Users.Add(new User
                {
                    Name = "Staff Admin",
                    Email = email,
                    Password = "Juan123",
                    Role = UserRole.Admin,
                    CreatedAt = DateTime.UtcNow
                });
            }
            else
            {
                user.Name = "Staff Admin";
                user.Password = "Juan123";
                user.Role = UserRole.Admin;
            }

            context.SaveChanges();
        }

        private static void SeedPetPostsFromImageFolder(_CotasContext context, IWebHostEnvironment env)
        {
            var imageDirectory = Path.Combine(env.ContentRootPath, "img");
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
                var fileStem = Path.GetFileNameWithoutExtension(imageFile);
                if (LooksLikeOpaqueFileToken(fileStem))
                {
                    continue;
                }

                var relative = Path.GetRelativePath(imageDirectory, imageFile).Replace("\\", "/");
                var imageUrl = $"/img/{relative}";

                var alreadyExists = context.PetPosts.Any(p => p.ImageUrl == imageUrl);
                if (alreadyExists)
                {
                    continue;
                }

                var petName = BuildPetNameFromFileName(Path.GetFileNameWithoutExtension(imageFile));
                var postType = PickPostTypeByIndex(seeded);
                var petCategory = InferPetCategory(petName, Path.GetFileName(imageFile));

                context.PetPosts.Add(new PetPost
                {
                    Title = BuildTitle(postType, petName),
                    PetName = petName,
                    PetCategory = petCategory,
                    PetKindLabel = petCategory == PetCategory.Others ? petName : null,
                    PostType = postType,
                    Description = BuildDescription(postType, petName),
                    Location = BuildLocation(seeded),
                    ContactEmail = "listings@cotas.demo",
                    ContactPhone = null,
                    PreferredContact = PreferredContactMethod.Any,
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

        /// <summary>
        /// Removes demo rows labeled "Community pet" (GUID-named image seeds / opaque filename cleanup).
        /// </summary>
        private static void RemoveCommunityPetPlaceholderPosts(_CotasContext context)
        {
            var toRemove = context.PetPosts
                .Where(p => p.PetName == "Community pet")
                .ToList();

            if (toRemove.Count == 0)
            {
                return;
            }

            context.PetPosts.RemoveRange(toRemove);
            context.SaveChanges();
        }

        private static bool IsLogoImagePath(string path)
        {
            var fileName = Path.GetFileNameWithoutExtension(path);
            return fileName.Contains("logo", StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Uploads often use GUID-style file names — those are not meaningful pet names on cards.
        /// </summary>
        private static bool LooksLikeOpaqueFileToken(string? text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return false;
            }

            var s = text.Trim().Replace("-", "").Replace("_", "");
            if (s.Length is < 16 or > 48)
            {
                return false;
            }

            foreach (var c in s)
            {
                if (!char.IsAsciiHexDigit(c))
                {
                    return false;
                }
            }

            return true;
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

        private static PetCategory InferPetCategory(string petName, string fileName)
        {
            var text = $"{petName} {fileName}".ToLowerInvariant();
            if (text.Contains("dog") || text.Contains("perro"))
            {
                return PetCategory.Dogs;
            }

            if (text.Contains("cat") || text.Contains("gato") || text.Contains("kitten"))
            {
                return PetCategory.Cats;
            }

            if (text.Contains("bird") || text.Contains("pajaro") || text.Contains("pájaro") || text.Contains("parrot"))
            {
                return PetCategory.Birds;
            }

            return PetCategory.Others;
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
                "Niagara Falls",
                "Welland",
                "Toronto",
                "St.Catherines",
                "Burlington",
                "Danforth"
            };

            return cities[index % cities.Length];
        }

        /// <summary>
        /// Drops <see cref="PetPost.ImageUrl"/> when it points at a local <c>/img/...</c> file that is not on disk
        /// (avoids endless 404s in dev when the DB still references removed sample images).
        /// </summary>
        private static void ClearMissingLocalImageUrls(_CotasContext context, IWebHostEnvironment env)
        {
            // Do not use StartsWith(..., StringComparison) — EF Core cannot translate it to SQL on SQLite.
            var posts = context.PetPosts
                .Where(p => p.ImageUrl != null && EF.Functions.Like(p.ImageUrl, "/img/%"))
                .ToList();

            var changed = false;
            foreach (var post in posts)
            {
                var relative = post.ImageUrl!.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                var fullPath = Path.Combine(env.ContentRootPath, relative);
                if (!File.Exists(fullPath))
                {
                    post.ImageUrl = null;
                    changed = true;
                }
            }

            if (changed)
            {
                context.SaveChanges();
            }
        }
    }
}