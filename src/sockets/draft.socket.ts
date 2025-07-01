import { Server, Socket } from "socket.io";
import { generateShortId, generateUuid } from "../utils/utils";
import type { Room, Side, SideTeam } from 'drafter-valorant-types';
import { StateRoomGame } from 'drafter-valorant-types';
import { computeTeamsWinrate } from "../utils/calculWinRate";
import { createMockRoom } from "../types/mockInterface";

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
        draft_session: {
          curent_turn: 0,
          draft_actions: []
        },
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

      // Vérifie que l'utilisateur est connecté
      if (!userId || userId === 0) {
        socket.emit("error", { message: "Vous devez être connecté pour rejoindre une équipe." });
        return;
      }

      // Vérifie que le côté demandé est valide
      if (side !== "attackers_side" && side !== "defenders_side") {
        socket.emit("error", { message: "Côté invalide." });
        return;
      }

      // Vérifie que le côté n'est pas déjà occupé
      if (room[side].team_leader !== 0) {
        socket.emit("error", { message: `Le côté ${side} est déjà occupé.` });
        return;
      }

      // Vérifie que l'utilisateur n'est pas déjà leader de l'autre côté
      const otherSide: SideTeam = side === "attackers_side" ? "defenders_side" : "attackers_side";
      if (room[otherSide].team_leader === userId) {
        socket.emit("error", { message: `Vous êtes déjà leader de l'équipe ${otherSide}.` });
        return;
      }

      // Tout est OK => Assigne l'utilisateur au côté choisi
      room[side].team_leader = userId;

      socket.join(roomId);
      console.log(`✅ L'utilisateur ${userId} a rejoint ${side} dans la room ${roomId}`);

      io.to(roomId).emit("room-updated", room);
    });



    socket.on("setReady", ({ roomId, side }: { roomId: string; side: "attackers_side" | "defenders_side" }) => {
      const room = rooms[roomId];
      if (!room) {
        socket.emit("error", { message: "Room introuvable" });
        return;
      }

      if (side !== "attackers_side" && side !== "defenders_side") {
        socket.emit("error", { message: "Side invalide" });
        return;
      }

      room[side].isReady = true;

      console.log(`✅ ${side} est prêt dans la room ${roomId}`);

      // Si les deux côtés sont prêts => on passe l'état en RUNNING
      if (room.attackers_side.isReady && room.defenders_side.isReady) {
        room.state = StateRoomGame.RUNNING;
        console.log(`🚀 La partie démarre dans la room ${roomId}`);
        io.to(roomId).emit("room-updated", room);
      } else {
        // Sinon on envoie juste la mise à jour
        io.to(roomId).emit("room-updated", room);
      }
    });

  
  socket.on('mockRoom', ( ) => {
    const room = createMockRoom();
    console.log('Mock room:', room);
    rooms[room.uuid] = room; // Simule l'ajout de la room
    console.log(rooms);
    socket.join(room.uuid);
    io.to(room.uuid).emit('endGame', { roomId: room.uuid });
  });

socket.on('endGame', async ({ roomId }) => {
  console.log(`🔴 Fin de la partie pour la room ${roomId}`);
  const room = rooms[roomId];
  console.log('room', room);
  if (!room) {
    console.error(`Room ${roomId} not found`);
    return;
  }

  try {
    const winrates = await computeTeamsWinrate(room);
    console.log('Winrates:', winrates);

    // Met à jour les winRate dans la room
    room.attackers_side.winRate = Number(winrates.attackers);
    room.defenders_side.winRate = Number(winrates.defenders);

    console.log(`🔵 Envoi des winrates mis à jour pour la room `, room);
    io.to(room.uuid).emit('gameResult', { winrates });
  } catch (error) {
    console.error('Erreur lors du calcul des winrates:', error);
    io.to(room.id).emit('gameResult', { error: 'Erreur serveur' });
  }
});




socket.on("disconnect", () => {
  console.log(`🔴 [socket] ${socket.id} déconnecté`);

  // Parcourt toutes les rooms
  // for (const roomId in rooms) {
  //   const room = rooms[roomId];

  //   let hasChanged = false;

  //   // Vérifie si le disconnect est le leader attackers
  //   if (room.attackers_side.team_leader_socket_id === socket.id) {
  //     room.attackers_side.team_leader = 0;
  //     room.attackers_side.isReady = false;
  //     room.attackers_side.team_leader_socket_id = null;
  //     console.log(`⚠️ Leader attackers parti dans ${roomId}`);
  //     hasChanged = true;
  //   }

  //   // Vérifie si le disconnect est le leader defenders
  //   if (room.defenders_side.team_leader_socket_id === socket.id) {
  //     room.defenders_side.team_leader = 0;
  //     room.defenders_side.isReady = false;
  //     room.defenders_side.team_leader_socket_id = null;
  //     console.log(`⚠️ Leader defenders parti dans ${roomId}`);
  //     hasChanged = true;
  //   }

  //   // Vérifie si c’est le créateur
  //   if (room.creator_socket_id === socket.id) {
  //     console.log(`🗑️ Suppression de la room ${roomId} car créateur parti`);
  //     delete rooms[roomId];
  //     io.to(roomId).emit("room-deleted", { message: "Le créateur a quitté la room." });
  //     continue; // On continue car la room est supprimée
  //   }

  //   // Si un changement, notifier les autres joueurs
  //   if (hasChanged) {
  //     io.to(roomId).emit("room-updated", room);
  //   }
  // }
});

};
