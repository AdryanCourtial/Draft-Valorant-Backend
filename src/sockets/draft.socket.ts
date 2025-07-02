import { Server, Socket } from "socket.io";
import { FindFirstNullInArray, generateShortId, generateUuid } from "../utils/utils";
import { ChangeSidePickOrBan, GetCurentTurn, RandomizeChamp, VerifyIfBanRoleIsTaken, VerifyIfChampIsOpen } from "../utils/game";
import type { Agent, Room, Side, SideTeam } from 'drafter-valorant-types';
import { referenceOrderDraftAction, StateRoomGame } from 'drafter-valorant-types';
import { clear } from "console";
import { computeTeamsWinrate } from "../utils/calculWinRate";
import { createMockRoom } from "../types/mockInterface";
import { prisma } from "../lib/prisma";

let rooms: { [roomId: string]: Room } = {}; 
const timers: { [roomId: string]: NodeJS.Timeout } = {};
const timeLefts: { [roomId: string]: number } = {};

export const draftSocketHandler = (io: Server, socket: Socket) => {
  console.log(`🟢 [socket] User connecté : ${socket.id}`);


  const TIMER_DURATION = 10

  const startTimer = (io: Server, roomId: string, onExpire: () => void) => {
    clearTimer(roomId); // sécurité

    let timeLeft = TIMER_DURATION;
    timeLefts[roomId] = timeLeft;

    timers[roomId] = setInterval(() => {
      timeLefts[roomId]--;
      io.to(roomId).emit("timer-update", timeLefts[roomId]);
      
      if (timeLefts[roomId] <= 0) {
        clearTimer(roomId);
        onExpire(); // appel de la logique de fin de round/question
      }

    }, 1000);

    console.log(`✅ Timer lancé pour la room ${roomId} → ID: ${timers[roomId]}`);
  };

  const clearTimer = (roomId: string) => {
      clearInterval(timers[roomId]);
      delete timers[roomId];
      delete timeLefts[roomId];
  };

  const NextRound = async (room: Room, roomId: string,  agent?: Agent, fromTimer: boolean = false) => {

    clearTimer(roomId)

    const curent_turn = GetCurentTurn(room);

    if (!curent_turn) {
      io.to(roomId).emit("draft-ended", room);
      return;
    }

    const side_to_change = curent_turn.team;

    const finalAgent = agent ?? await RandomizeChamp(room);

    ChangeSidePickOrBan(room, side_to_change, finalAgent, curent_turn.type);

    room.draft_session.curent_turn += 1;

    io.to(roomId).emit("agent-picked", room);

    const nextTurn = GetCurentTurn(room);

    if (!nextTurn) {
      console.log(`[NEXT ROUND] Aucun tour suivant : fin du draft`);
      io.to(roomId).emit("draft-ended", room);
      return;
    }
    
    startTimer(io, roomId, () => {
      NextRound(room, roomId, undefined, false); 
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

      socket.join(room.uuid);
      io.to(room.uuid).emit("room-created", room);

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

      // Si les deux côtés sont prêts => on passe l'état en RUNNING
      if (room.attackers_side.isReady && room.defenders_side.isReady) {

        room.state = StateRoomGame.RUNNING;
        room.draft_session.curent_turn += 1

        io.to(roomId).emit("start-draft", room);

        startTimer(io, roomId, () => {

          NextRound(room, roomId);

        })

      } else {
        // Sinon on envoie juste la mise à jour
        io.to(roomId).emit("room-updated", room);
      }
    });

    socket.on("confirm-round", ({ roomId, agent, userId }: { roomId: string, agent: Agent, userId?: number}) => {
      const room = rooms[roomId];
      
      
      if (VerifyIfChampIsOpen(room, agent)) {
        socket.emit("room-error", { message: "Champion déjà pick ou ban" });
        return
      }

      if (!userId) {
        socket.emit("room-error", { message: "Seul un utilisateur connecté peut pick" });
        return
      }

      const curent_round = GetCurentTurn(room)

      if (curent_round?.type === "ban" && VerifyIfBanRoleIsTaken(room, agent)){
        socket.emit("room-error", { message: "Vous avez déjà ban personnages de ce rôle " });
        return
      }

      if (!curent_round) {
        room.state = StateRoomGame.FINISHED
        return
      }

      if (room[curent_round?.team].team_leader !== userId) {
        socket.emit("room-error", { message: "Ce n'est pas à votre tour de jouer" });
        return
      }

      clearTimer(roomId)

      NextRound(room, roomId, agent, false);

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

      await prisma.draftHistory.create({
        data: {
          uuid: room.uuid,
          publicLink: room.public_link,
          creatorId: room.creator_id,
          mapSelected: room.map_selected,
          state: room.state,
          attackersSide: JSON.parse(JSON.stringify(room.attackers_side)),
          defendersSide: JSON.parse(JSON.stringify(room.defenders_side)),
          draftSession: JSON.parse(JSON.stringify(room.draft_session))
        }
      });


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
