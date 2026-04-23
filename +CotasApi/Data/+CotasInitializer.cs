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
            var configuration = scope.ServiceProvider.GetService<IConfiguration>();
            var enableLegacyRecovery = configuration?.GetValue<bool?>("Seeding:EnableLegacyRecoveryPosts") ?? true;

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
                if (!HasPublicVisiblePosts(context))
                {
                    SeedEmergencyData(context);
                }
                if (enableLegacyRecovery)
                {
                    SeedLegacyRecoveryPosts(context);
                }
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

        private static void SeedEmergencyData(_CotasContext context)
        {
            var guestUser = context.Users.FirstOrDefault(u => u.Email == "guest@cotas.local");
            if (guestUser == null) return;

            var added = false;
            if (!context.PetPosts.Any(p => p.Title == "Bruno is ready for adoption"))
            {
                context.PetPosts.Add(new PetPost
                {
                    Title = "Bruno is ready for adoption",
                    PetName = "Bruno",
                    PetCategory = PetCategory.Dogs,
                    PostType = PostType.Adoption,
                    Description = "A friendly dog looking for a home.",
                    Location = "Welland",
                    ContactEmail = "listings@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1543466835-00a7907e9de1",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now,
                    UserId = guestUser.UserId
                });
                added = true;
            }

            if (!context.PetPosts.Any(p => p.Title == "Lost Cat: Luna"))
            {
                context.PetPosts.Add(new PetPost
                {
                    Title = "Lost Cat: Luna",
                    PetName = "Luna",
                    PetCategory = PetCategory.Cats,
                    PostType = PostType.Lost,
                    Description = "Lost near Niagara College. Please help!",
                    Location = "Niagara Falls",
                    ContactEmail = "help@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now,
                    UserId = guestUser.UserId
                });
                added = true;
            }

            if (added)
            {
                context.SaveChanges();
            }
        }

        private static void SeedLegacyRecoveryPosts(_CotasContext context)
        {
            var guestUser = context.Users.FirstOrDefault(u => u.Email == "guest@cotas.local");
            if (guestUser == null)
            {
                return;
            }

            var legacyPosts = new List<PetPost>
            {
                new PetPost
                {
                    Title = "Lost: Cat2",
                    PetName = "Cat2",
                    PetCategory = PetCategory.Cats,
                    PostType = PostType.Lost,
                    Description = "Cat2 was last seen nearby. Please contact us if you have any information.",
                    Location = "Santiago",
                    ContactEmail = "listings@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-16),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "Found pet: Dog1",
                    PetName = "Dog1",
                    PetCategory = PetCategory.Dogs,
                    PostType = PostType.Found,
                    Description = "Dog1 was found safe and is waiting to be reunited with the family.",
                    Location = "La Vega",
                    ContactEmail = "listings@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1543466835-00a7907e9de1",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-15),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "Dog2 is ready for adoption",
                    PetName = "Lucas",
                    PetCategory = PetCategory.Dogs,
                    PostType = PostType.Adoption,
                    Description = "Dog2 is friendly, healthy, and waiting for a loving family.",
                    Location = "San Cristobal",
                    ContactEmail = "listings@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-14),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "Lost: Dog3",
                    PetName = "Dog3",
                    PetCategory = PetCategory.Dogs,
                    PostType = PostType.Lost,
                    Description = "Dog3 was last seen nearby. Please contact us if you have any information.",
                    Location = "Puerto Plata",
                    ContactEmail = "listings@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1561037404-61cd46aa615b",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-13),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "Found pet: Dog4",
                    PetName = "Dog4",
                    PetCategory = PetCategory.Dogs,
                    PostType = PostType.Found,
                    Description = "Dog4 was found safe and is waiting to be reunited with the family.",
                    Location = "Bavaro",
                    ContactEmail = "listings@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1517849845537-4d257902454a",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-12),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "Found pet: Turtle1",
                    PetName = "Marthin",
                    PetCategory = PetCategory.Others,
                    PostType = PostType.Found,
                    Description = "Turtle1 was found safe and is waiting to be reunited with the family.",
                    Location = "La Vega",
                    ContactEmail = "listings@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1552728089-57bdde30beb3",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-11),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "Cute cat",
                    PetName = "Milo",
                    PetCategory = PetCategory.Cats,
                    PostType = PostType.Adoption,
                    Description = "My cat just gave birth this kitty, i need help to give it to someone who loves cats",
                    Location = "Welland",
                    ContactEmail = "listings@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1574158622682-e40e69881006",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-10),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "Jose Byron Is LOST",
                    PetName = "Jose Byron",
                    PetCategory = PetCategory.Others,
                    PostType = PostType.Lost,
                    Description = "Please help me to find my monkey donkey",
                    Location = "Niagara Falls",
                    ContactEmail = "listings@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-9),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "I found this bird",
                    PetName = "Birdy",
                    PetCategory = PetCategory.Birds,
                    PostType = PostType.Found,
                    Description = "Bird",
                    Location = "NF",
                    ContactEmail = "listings@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1444464666168-49d633b86797",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-8),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "parrot looking for a family",
                    PetName = "Martin",
                    PetCategory = PetCategory.Birds,
                    PostType = PostType.Adoption,
                    Description = "Please let me know anything",
                    Location = "Niagara Falls",
                    ContactEmail = "jdlopz10@gmail.com",
                    PreferredContact = PreferredContactMethod.Email,
                    ImageUrl = "https://images.unsplash.com/photo-1522926193341-e9ffd686c60f",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-7),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "Cat1 is ready for adoption",
                    PetName = "Cat1",
                    PetCategory = PetCategory.Cats,
                    PostType = PostType.Adoption,
                    Description = "Cat1 is friendly, healthy, and waiting for a loving family.",
                    Location = "Santo Domingo",
                    ContactEmail = "listings@cotas.demo",
                    PreferredContact = PreferredContactMethod.Any,
                    ImageUrl = "https://images.unsplash.com/photo-1495360010541-f48722b34f7d",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-6),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "Mario is looking 4 home",
                    PetName = "Mario",
                    PetCategory = PetCategory.Dogs,
                    PostType = PostType.Adoption,
                    Description = "Pls help Mario to have a home",
                    Location = "Welland",
                    ContactEmail = "Sofia@gmail.com",
                    PreferredContact = PreferredContactMethod.Email,
                    ImageUrl = "https://images.unsplash.com/photo-1518717758536-85ae29035b6d",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-5),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "Found near college: Rocky",
                    PetName = "Rocky",
                    PetCategory = PetCategory.Dogs,
                    PostType = PostType.Found,
                    Description = "Friendly dog found near campus entrance. Looking for the owner.",
                    Location = "Niagara Falls",
                    ContactEmail = "listings@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-4),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "Missing cat: Nube",
                    PetName = "Nube",
                    PetCategory = PetCategory.Cats,
                    PostType = PostType.Lost,
                    Description = "Small white cat missing since yesterday evening.",
                    Location = "Welland",
                    ContactEmail = "help@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1592194996308-7b43878e84a6",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-3),
                    UserId = guestUser.UserId
                },
                new PetPost
                {
                    Title = "Parakeet for adoption: Kiwi",
                    PetName = "Kiwi",
                    PetCategory = PetCategory.Birds,
                    PostType = PostType.Adoption,
                    Description = "Calm parakeet, healthy and ready for a caring home.",
                    Location = "St. Catharines",
                    ContactEmail = "listings@cotas.demo",
                    ImageUrl = "https://images.unsplash.com/photo-1552728089-57bdde30beb3",
                    Status = PostStatus.Approved,
                    DatePosted = DateTime.Now.AddDays(-2),
                    UserId = guestUser.UserId
                }
            };

            var added = false;
            foreach (var legacy in legacyPosts)
            {
                var exists = context.PetPosts.Any(p => p.Title == legacy.Title && p.PetName == legacy.PetName);
                if (exists)
                {
                    continue;
                }

                context.PetPosts.Add(legacy);
                added = true;
            }

            if (added)
            {
                context.SaveChanges();
            }
        }

        private static bool HasPublicVisiblePosts(_CotasContext context)
        {
            return context.PetPosts.Any(p =>
                p.Status == PostStatus.Approved &&
                p.ImageUrl != null &&
                p.ImageUrl != "");
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