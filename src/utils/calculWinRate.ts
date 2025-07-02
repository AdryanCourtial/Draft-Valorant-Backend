import { Room } from 'drafter-valorant-types';
import { prisma } from '../lib/prisma';


export async function computeTeamsWinrate(room: Room) {
  const mapId = room.map_selected;

  console.log("JE SUIS LE MAP ID", mapId)

  // 1️⃣ Récupère la map
  const map = await prisma.map.findFirst({
    where: { id: parseInt(mapId) },
    include: {
      mapWinrateStats: {
        orderBy: { recordedAt: 'desc' },
        take: 1,
        include: { topAgentWinrates: true }
      }
    }
  });

  if (!map || map.mapWinrateStats.length === 0) throw new Error('Map data not found');

  const mapStat = map.mapWinrateStats[0];
  const topAgentsOnMap = mapStat.topAgentWinrates.map(t => t.agentId);

  // 2️⃣ Fonction pour calculer un side
  const calcSide = async (agentIds: number[], isAttackers: boolean) => {
    const agents = await prisma.agent.findMany({
      where: { id: { in: agentIds } },
      include: { role: true, winrateStats: { orderBy: { recordedAt: 'desc' }, take: 1 } }
    });

    const avgAgentWinrate = agents.reduce((acc, agent) => {
      const winrate = agent.winrateStats[0]?.winrate || 50;
      return acc + winrate;
    }, 0) / agents.length;

    const topAgentBonus = agents.filter(a => topAgentsOnMap.includes(a.id)).length * 2; 

    const uniqueRoles = new Set(agents.map(a => a.role.displayName));
    const roleBonus = uniqueRoles.size >= 4 ? 5 : 0; 

    // Pondération map side
    const mapSideWeight = isAttackers ? mapStat.atkWinrate : mapStat.defWinrate;
    const sideWinrate = (avgAgentWinrate + topAgentBonus + roleBonus) * (mapSideWeight / 50);

    return sideWinrate;
  };

    const attackerIds = room.attackers_side.agents.filter(a => a !== null).map(a => Number(a.id));
    const defenderIds = room.defenders_side.agents.filter(a => a !== null).map(a => Number(a.id));


    const attackersWinrate = await calcSide(attackerIds, true);
    const defendersWinrate = await calcSide(defenderIds, false);


  // 3️⃣ Normalise pour faire 100%
  const total = attackersWinrate + defendersWinrate;
  const attackersPercent = (attackersWinrate / total) * 100;
  const defendersPercent = (defendersWinrate / total) * 100;

  return {
    attackers: attackersPercent.toFixed(1),
    defenders: defendersPercent.toFixed(1)
  };
}


