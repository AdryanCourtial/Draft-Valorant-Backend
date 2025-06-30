import { Server, Socket } from "socket.io";
import { ChangeSidePickOrBan, FindFirstNullInArray, generateShortId, generateUuid, VerifyIfChampIsOpen } from "../utils/utils";
import type { Agent, Room, Side, SideTeam } from 'drafter-valorant-types';
import { referenceOrderDraftAction, StateRoomGame } from 'drafter-valorant-types';

let rooms: { [roomId: string]: Room } = {}; 

export const draftSocketHandler = (io: Server, socket: Socket) => {
  console.log(`🟢 [socket] User connecté : ${socket.id}`);


  socket.on("createRoom", ({ creatorId ,mapId, attackers, defenders }) => {
    const uuid = generateUuid();
    const public_link = process.env.FRONT_URL+  `/draft` + `/${uuid}`;

    const createNewDraftSession = () => {
      return JSON.parse(JSON.stringify(referenceOrderDraftAction));
    };

    try {
      const room: Room = {
        id: generateShortId(),
        uuid,
        public_link,
        map_selected: mapId,
        draft_session: createNewDraftSession(),
        state: StateRoomGame.WAITING,
        creator_id: creatorId,
        spectators: [],
        attackers_side: {
          name: attackers,
          team_leader: 0,
          isReady: false,
          agents: Array(5).fill(null),
          bans: Array(2).fill(null),
        },
        defenders_side: {
          name: defenders,
          team_leader: 0,
          isReady: false,
          agents: Array(5).fill(null),
          bans: Array(2).fill(null)
        }
      };
    
      rooms[uuid] = room;

      console.log(room)
      socket.join(room.uuid);
      io.to(room.uuid).emit("room-created", room);

      // console.log('je suis rooms', rooms);
      // console.log('je suis rooms la draft de réference', rooms);

      
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

    socket.on("test-is-ready", ({ roomId }: { roomId: string}) => {
      const room = rooms[roomId];

      console.log("TOUR ACTUELLE", room.draft_session.curent_turn)


      room.state = StateRoomGame.RUNNING;
      room.draft_session.curent_turn += 1

      console.log("TOUR PROCHAIN", room.draft_session.curent_turn)


      io.to(roomId).emit("start-draft", room );
    });

    socket.on("confirm-round", ({ roomId, agent }: { roomId: string, agent: Agent}) => {
      const room = rooms[roomId];

      const listChampSelected = room.attackers_side.agents.concat(room.attackers_side.bans, room.defenders_side.agents, room.defenders_side.bans)
      console.log("🔴JE SUIS LARRAY DES PERSONNAGE DEJA UTILIsé", listChampSelected)

      if (VerifyIfChampIsOpen(room, agent)) {
        console.log("Ce Champion à déjà été pris")
        socket.emit("error", { message: "Ce champion è déjà été pick ou ban" });
        return
      }

      const curent_turn = room.draft_session.draft_actions.find((value) => {
        return value.turn === room.draft_session.curent_turn
      })

      if (!curent_turn) return

      const side_to_change = curent_turn.team

      if (curent_turn.type === "ban") {

        ChangeSidePickOrBan(room, side_to_change, agent, "ban")

      } else {

        ChangeSidePickOrBan(room, side_to_change, agent, "pick")

      }

      room.draft_session.curent_turn += 1

      console.log("POCHAIN TOUR", room.draft_session.curent_turn)

      io.to(roomId).emit("agent-picked", room );
    });


  // socket.on("pick-agent", ({ roomId, agent }) => {
  //   io.to(roomId).emit("agent-picked", { agent, by: socket.id });
  // });

  socket.on("leaveAllRooms", () => {
    const roomsToLeave = Array.from(socket.rooms).filter((room) => room !== socket.id);
    roomsToLeave.forEach((room) => socket.leave(room));
    console.log(`🧹 ${socket.id} a quitté toutes ses rooms personnalisées`);
  });
  
  socket.on("disconnect", () => {
    console.log(`🔴 [socket] ${socket.id} déconnecté`);
    
  });
};
