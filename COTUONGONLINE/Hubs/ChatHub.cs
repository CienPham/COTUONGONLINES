using Microsoft.AspNetCore.SignalR;

namespace COTUONGONLINE.Hubs
{
    public class ChatHub : Hub
    {
        public async Task JoinRoom(string roomId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
        }

        public async Task LeaveRoom(string roomId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        }

        public async Task SendMessage(string roomId, string playerId, string message)
        {
            await Clients.Group(roomId).SendAsync("ReceiveMessage", $"{playerId}: {message}");
        }
    }
}
