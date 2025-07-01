import { Server, Socket } from "socket.io";
import { FindFirstNullInArray, generateShortId, generateUuid } from "../utils/utils";
import { ChangeSidePickOrBan, GetCurentTurn, RandomizeChamp, VerifyIfChampIsOpen } from "../utils/game";
import type { Agent, Room, Side, SideTeam } from 'drafter-valorant-types';
import { referenceOrderDraftAction, StateRoomGame } from 'drafter-valorant-types';

let rooms: { [roomId: string]: Room } = {}; 

export const draftSocketHandler = (io: Server, socket: Socket) => {
  console.log(`🟢 [socket] User connecté : ${socket.id}`);

  const timersByRoomId: { [roomId: string]: ReturnType<typeof setInterval> } = {};

  const TIMER_DURATION = 10

  const startTimer = (room: Room, roomId: string, onExpire: () => void) => {
    let timeLeft = TIMER_DURATION;
    
    timersByRoomId[room.uuid] = setInterval(() => {
      timeLeft--;
      
      console.log(`[TIMER][${room.uuid}] Time left:`, timeLeft);
      io.to(roomId).emit("timer-update", timeLeft);
      
      if (timeLeft <= 0) {
        clearTimer(room);
        // console.log(`[TIMER][${room.uuid}] Expired!`);
        onExpire(); // callback pour passer automatiquement le tour ou autre
      }
    }, 1000);

    console.log(`🚀 JE VIENS DE LANCER LE TIMER ${timersByRoomId[room.uuid]}`)

  }

  const clearTimer = (room: Room) => {
    const timer = timersByRoomId[room.uuid];
    if (timer) {
      console.log("Je vais clear le timer : ", timersByRoomId[room.uuid])
      clearInterval(timer);
      console.log("Je VIENS de clear le timer : ", timersByRoomId[room.uuid])
      delete timersByRoomId[room.uuid];
    }
  }

  const NextRound = async (room: Room, roomId: string,  agent?: Agent, shouldStartTimer: boolean = true) => {

    clearTimer(room)
    
    const curent_turn = GetCurentTurn(room)

    if (!curent_turn) {
      clearTimer(room)
      return
    }

    const side_to_change = curent_turn.team

    const finalAgent = agent ?? await RandomizeChamp(room)

    ChangeSidePickOrBan(room, side_to_change, finalAgent, curent_turn.type)

    room.draft_session.curent_turn += 1

    io.to(roomId).emit("agent-picked", room);

    if (shouldStartTimer) {
      startTimer(room, roomId, async () => {
  
        NextRound(room, roomId, undefined, true)
          
      });
    }

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

      socket.join(room.uuid);
      io.to(room.uuid).emit("room-created", room);

      // console.log('je suis rooms', rooms);
      // console.log('je suis rooms la draft de réference', rooms);

      
    } catch (error) {
      console.error("Error creating room:", error);
      socket.emit("room-error", { message: "Erreur lors de la création de la room" });
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
        socket.emit("room-error", { message: "Vous devez être connecté pour rejoindre une équipe." });
        return;
      }

      // Vérifie que le côté demandé est valide
      if (side !== "attackers_side" && side !== "defenders_side") {
        socket.emit("room-error", { message: "Côté invalide." });
        return;
      }

      // Vérifie que le côté n'est pas déjà occupé
      if (room[side].team_leader !== 0) {
        socket.emit("room-error", { message: `Le côté ${side} est déjà occupé.` });
        return;
      }

      // Vérifie que l'utilisateur n'est pas déjà leader de l'autre côté
      const otherSide: SideTeam = side === "attackers_side" ? "defenders_side" : "attackers_side";
      if (room[otherSide].team_leader === userId) {
        socket.emit("room-error", { message: `Vous êtes déjà leader de l'équipe ${otherSide}.` });
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
        socket.emit("room-error", { message: "Room introuvable" });
        return;
      }

      if (side !== "attackers_side" && side !== "defenders_side") {
        socket.emit("room-error", { message: "Side invalide" });
        return;
      }

      room[side].isReady = true;

      console.log(`✅ ${side} est prêt dans la room ${roomId}`);

      // Si les deux côtés sont prêts => on passe l'état en RUNNING
      if (room.attackers_side.isReady && room.defenders_side.isReady) {

        room.state = StateRoomGame.RUNNING;
        room.draft_session.curent_turn += 1

        console.log(`🚀 La partie démarre dans la room ${roomId}`);
        
        
        io.to(roomId).emit("start-draft", room);
        
        startTimer(room, roomId, () => {
          console.log(`🚀 LJE SUIS LE NOM DU TIMER DU ISREADY QUI VIENT DE IS READY ${timersByRoomId[room.uuid]}`)
          NextRound(room, roomId)
        })


      } else {
        // Sinon on envoie juste la mise à jour
        io.to(roomId).emit("room-updated", room);
      }
    });

    socket.on("confirm-round", ({ roomId, agent }: { roomId: string, agent: Agent}) => {
      const room = rooms[roomId];
      clearTimer(room)
      console.log(`🚀 JE VIENS DE CLEAR LE TIMER DE CONFIRM ROOM ${timersByRoomId[room.uuid]}`)

      
      if (VerifyIfChampIsOpen(room, agent)) {
        socket.emit("room-error", { message: "Champion déjà pick ou ban" });
        return
      }


      startTimer(room, roomId, () => {
        NextRound(room, roomId, agent, true)
      })

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
