import { Server, Socket } from "socket.io";
import { FindFirstNullInArray, generateShortId, generateUuid } from "../utils/utils";
import { ChangeSidePickOrBan, GetCurentTurn, RandomizeChamp, VerifyIfChampIsOpen } from "../utils/game";
import type { Agent, Room, Side, SideTeam } from 'drafter-valorant-types';
import { referenceOrderDraftAction, StateRoomGame } from 'drafter-valorant-types';

let rooms: { [roomId: string]: Room } = {}; 

export const draftSocketHandler = (io: Server, socket: Socket) => {
  console.log(`🟢 [socket] User connecté : ${socket.id}`);

  const timersByRoomId: { [roomId: string]: ReturnType<typeof setInterval> } = {};


  const TIMER_DURATION = 25

  const startTimer = (roomId: string, onExpire: () => void) => {
    clearTimer(roomId);

    let timeLeft = TIMER_DURATION;

    timersByRoomId[roomId] = setInterval(() => {
        timeLeft--;

        console.log(`[TIMER][${roomId}] Time left:`, timeLeft);
        io.to(roomId).emit("timer-update", timeLeft);

        if (timeLeft <= 0) {
          clearTimer(roomId);
          console.log(`[TIMER][${roomId}] Expired!`);
          onExpire(); // callback pour passer automatiquement le tour ou autre
        }
      }, 1000);
  }

  const clearTimer = (roomId: string) => {
    const timer = timersByRoomId[roomId];
    if (timer) {
      clearInterval(timer);
      delete timersByRoomId[roomId];
    }
  }

  const NextRound = async (room: Room, roomId: string, agent?: Agent) => {

    clearTimer(room.uuid)
    
    const curent_turn = GetCurentTurn(room)

    if (!curent_turn) {
      clearTimer(roomId)
      return
    }

    const side_to_change = curent_turn.team

    const finalAgent = agent ?? await RandomizeChamp(room)

    ChangeSidePickOrBan(room, side_to_change, finalAgent, curent_turn.type)

    room.draft_session.curent_turn += 1

    io.to(roomId).emit("agent-picked", room);

    startTimer(roomId, async () => {

      NextRound(room, roomId)
        
    });
  }


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

    socket.on("test-is-ready", async ({ roomId }: { roomId: string}) => {
      const room = rooms[roomId];

      room.state = StateRoomGame.RUNNING;
      room.draft_session.curent_turn += 1

      io.to(roomId).emit("start-draft", room );

      startTimer(roomId, () => {
        NextRound(room, roomId)
      })
      
    });

    socket.on("confirm-round", ({ roomId, agent }: { roomId: string, agent: Agent}) => {
      const room = rooms[roomId];

      
      if (VerifyIfChampIsOpen(room, agent)) {
        socket.emit("room-error", { message: "Champion déjà pick ou ban" });
        return
      }

      NextRound(room, roomId, agent)

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
