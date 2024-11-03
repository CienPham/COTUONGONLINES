namespace COTUONGONLINE.Models
{
    public class Room
    {
        public string RoomId { get; set; }
        public List<string> Players { get; set; } = new List<string>();
        public bool IsFull => Players.Count == 2;
        public string GameStatus { get; set; } = "waiting"; // waiting, playing, finished

        public Room(string roomId)
        {
            RoomId = roomId;
        }

        public void AddPlayer(string playerId)
        {
            if (!IsFull)
            {
                Players.Add(playerId);
            }
        }
    }
}
