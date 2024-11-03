using COTUONGONLINE.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace COTUONGONLINE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomController : Controller
    {
        private static Dictionary<string, Room> rooms = new Dictionary<string, Room>();
        [HttpPost("create")]
        public IActionResult CreateRoom()
        {
            string roomId;
            // Lặp lại cho đến khi tạo được mã phòng duy nhất
            do
            {
                roomId = new Random().Next(100000, 999999).ToString();
            } while (rooms.ContainsKey(roomId));

            var newRoom = new Room(roomId);
            rooms.Add(roomId, newRoom);

            return Ok(new { RoomId = roomId });
        }

        [HttpPost("join")]
        public IActionResult JoinRoom([FromBody] JoinRoomRequest request)
        {
            if (rooms.ContainsKey(request.RoomId))
            {
                var room = rooms[request.RoomId];
                if (!room.IsFull)
                {
                    room.AddPlayer(request.PlayerId);
                    if (room.IsFull)
                    {
                        room.GameStatus = "playing";
                    }
                    return Ok(new { Message = "Joined successfully", RoomStatus = room.GameStatus });
                }
                return BadRequest("Room is full.");
            }
            return NotFound("Room not found.");
        }
    }

    public class JoinRoomRequest
    {
        public string RoomId { get; set; }
        public string PlayerId { get; set; }
    }
}
