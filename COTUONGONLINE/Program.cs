using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using COTUONGONLINE.Data;
using COTUONGONLINE.Areas.Identity.Data;
using COTUONGONLINE.Hubs;
var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("COTUONGONLINEContextConnection") ?? throw new InvalidOperationException("Connection string 'COTUONGONLINEContextConnection' not found.");

builder.Services.AddDbContext<COTUONGONLINEContext>(options => options.UseSqlServer(connectionString));

builder.Services.AddDefaultIdentity<COTUONGONLINEUser>(options => options.SignIn.RequireConfirmedAccount = true).AddEntityFrameworkStores<COTUONGONLINEContext>();

// ??ng ký SignalR
builder.Services.AddSignalR();
// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();
app.MapHub<COTUONGONLINE.Hubs.RoomHub>("/roomHub");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapRazorPages();
app.Run();
