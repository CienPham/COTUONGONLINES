using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace COTUONGONLINE.Hubs
{
    public class RoomHub : Hub
    {
        private static Dictionary<string, List<string>> rooms = new Dictionary<string, List<string>>();
        private static Dictionary<string, string> gameStates = new Dictionary<string, string>();


        // Phương thức để tham gia phòng
        public async Task JoinRoom(string roomId, string playerId)
        {
            if (!rooms.ContainsKey(roomId))
            {
                rooms[roomId] = new List<string>();
                gameStates[roomId] = "active"; // Khởi tạo trạng thái game
            }

            // Kiểm tra số lượng người chơi
            if (rooms[roomId].Count >= 2)
            {
                await Clients.Caller.SendAsync("ReceiveMessage", "Room is full!");
                return;
            }

            rooms[roomId].Add(playerId);
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            await Clients.Group(roomId).SendAsync("ReceiveMessage", $"{playerId} has joined the room.");

            // Nếu đủ 2 người chơi, bắt đầu game
            if (rooms[roomId].Count == 2)
            {
                await Clients.Group(roomId).SendAsync("ReceiveMessage", "Game starts! Red player goes first.");
            }
        }
        public async Task SendGameOver(string roomId, string winner)
        {
            if (rooms.ContainsKey(roomId))
            {
                gameStates[roomId] = "finished";
                await Clients.Group(roomId).SendAsync("ReceiveGameOver", winner);
                await Clients.Group(roomId).SendAsync("ReceiveMessage", $"Game Over! {winner.ToUpper()} player wins!");
            }
        }


        // Phương thức rời phòng
        public async Task LeaveRoom(string roomId, string playerId)
        {
            if (rooms.ContainsKey(roomId))
            {
                rooms[roomId].Remove(playerId);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);

                // Thông báo người chơi khác rằng người chơi đã rời phòng
                await Clients.Group(roomId).SendAsync("ReceiveMessage", $"{playerId} has left the room.");

                // Xóa phòng nếu không còn ai trong đó
                if (rooms[roomId].Count == 0)
                {
                    rooms.Remove(roomId);
                }
            }
        }


        // Phương thức để gửi tin nhắn trong phòng
        public async Task SendMessage(string roomId, string playerId, string message)
        {
            await Clients.Group(roomId).SendAsync("ReceiveMessage", $"{playerId}: {message}");
        }
        public async Task SendChessMove(string message)
        {
            // Gửi thông điệp đến tất cả các client trong phòng
            await Clients.All.SendAsync("ReceiveChessMove", message);
        }

    }
}
