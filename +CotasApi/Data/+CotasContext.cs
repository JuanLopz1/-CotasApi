using _CotasApi.Models;
using Microsoft.EntityFrameworkCore;

namespace _CotasApi.Data
{
    public class _CotasContext : DbContext
    {
        public _CotasContext(DbContextOptions<_CotasContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<PetPost> PetPosts => Set<PetPost>();
        public DbSet<Conversation> Conversations => Set<Conversation>();
        public DbSet<Message> Messages => Set<Message>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasMany(u => u.PetPosts)
                .WithOne(p => p.User)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

                            modelBuilder.Entity<PetPost>()
                                .HasMany(p => p.Conversations)
                                .WithOne(c => c.PetPost)
                                .HasForeignKey(c => c.PetPostId)
                                .OnDelete(DeleteBehavior.Cascade);

                            modelBuilder.Entity<Conversation>()
                                .HasMany(c => c.Messages)
                                .WithOne(m => m.Conversation)
                                .HasForeignKey(m => m.ConversationId)
                                .OnDelete(DeleteBehavior.Cascade);

                            modelBuilder.Entity<Conversation>()
                                .HasOne(c => c.StarterUser)
                                .WithMany()
                                .HasForeignKey(c => c.StarterUserId)
                                .OnDelete(DeleteBehavior.Restrict);

                            modelBuilder.Entity<Conversation>()
                                .HasOne(c => c.ReceiverUser)
                                .WithMany()
                                .HasForeignKey(c => c.ReceiverUserId)
                                .OnDelete(DeleteBehavior.Restrict);

                            modelBuilder.Entity<Message>()
                                .HasOne(m => m.SenderUser)
                                .WithMany(u => u.Messages)
                                .HasForeignKey(m => m.SenderUserId)
                                .OnDelete(DeleteBehavior.Restrict);
                        }
                    }
                }
