import { Server, Socket } from "socket.io";
import { generateShortId, generateUuid } from "../utils/utils";
import type { Room, Side, SideTeam } from 'drafter-valorant-types';
import { StateRoomGame } from 'drafter-valorant-types';

let rooms: { [roomId: string]: Room } = {}; 

export const draftSocketHandler = (io: Server, socket: Socket) => {
  console.log(`🟢 [socket] User connecté : ${socket.id}`);


  socket.on("createRoom", ({ creatorId ,mapId, attackers, defenders }) => {
    const uuid = generateUuid();
    const public_link = process.env.FRONT_URL+  `/draft` + `/${uuid}`;

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
          isReady: false,
          agents: [],
          bans: []
        },
        defenders_side: {
          name: defenders,
          team_leader: 0,
          isReady: false,
          agents: [],
          bans: []
        }
      };
    
      rooms[uuid] = room;

      socket.join(room.uuid);
      io.to(room.uuid).emit("room-created", room);

      console.log('je suis rooms', rooms);
      
    } catch (error) {
      console.error("Error creating room:", error);
      socket.emit("error", { message: "Erreur lors de la création de la room" });
    }
  });

  socket.on("getRoom", (roomId: string) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error", { message: "Room introuvable" });
      return;
    }
    socket.join(roomId);
    console.log(`🔵 ${socket.id} a rejoint la room ${roomId}`)
    socket.emit("room-updated", room)
    });
  
    
  socket.on("join-side", ({ roomId, userId, side }: { roomId: string, userId: number, side: SideTeam }) => {
      const room = rooms[roomId];
      if (!room) {
        socket.emit("error", { message: "Room introuvable" });
        return;
      }

      if (room[side].team_leader !== 0) {
        socket.emit("error", { message: `Côté ${side} déjà occupé` });
        return;
      }

      room[side].team_leader = userId;

      socket.join(roomId);
      console.log(`✅ ${userId} a rejoint ${side} dans ${roomId}`);

      io.to(roomId).emit("room-updated", room);
    });


  socket.on("pick-agent", ({ roomId, agent }) => {
    io.to(roomId).emit("agent-picked", { agent, by: socket.id });
  });

  socket.on("disconnect", () => {
    console.log(`🔴 [socket] ${socket.id} déconnecté`);
  });
};
