import { Server, Socket } from "socket.io";
import { generateShortId, generateUuid } from "../utils/utils";
import type { Room } from 'drafter-valorant-types';
import { StateRoomGame } from 'drafter-valorant-types';

export const draftSocketHandler = (io: Server, socket: Socket) => {
  console.log(`🟢 [socket] User connecté : ${socket.id}`);

  socket.on("createRoom", ({ creatorId ,mapId, attackers, defenders }) => {
    const uuid = generateUuid();
    const public_link = process.env.FRONT_URL + `/${uuid}`;

    try {
      const room: Room = {
        id: generateShortId(),
        uuid,
        public_link,
        map_selected: mapId,
        state: StateRoomGame.WAITING,
        creator_id: creatorId,
        spectators: [],
        attackers_side: {
          name: attackers,
          team_leader: 0,
          agents: [],
          bans: []
        },
        defenders_side: {
          name: defenders,
          team_leader: 0,
          agents: [],
          bans: []
        }
      };
    
      socket.join(room.uuid);
      io.to(room.uuid).emit("room-created", room);
      
    } catch (error) {
      console.error("Error creating room:", error);
      socket.emit("error", { message: "Erreur lors de la création de la room" });
    }
  });
  
    
    
  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);
    console.log(`🔗 ${socket.id} a rejoint la room ${roomId}`);
    io.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("pick-agent", ({ roomId, agent }) => {
    io.to(roomId).emit("agent-picked", { agent, by: socket.id });
  });

  socket.on("disconnect", () => {
    console.log(`🔴 [socket] ${socket.id} déconnecté`);
  });
};
