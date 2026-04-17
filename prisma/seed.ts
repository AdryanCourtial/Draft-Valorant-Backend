import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";
import { ApiMap } from "../src/types/mapsInterface";
import { ApiAgent, ApiRole } from "../src/types/agentInterface";
import fs from "fs/promises";

const prisma = new PrismaClient();

function trimText(value: string | null | undefined, maxLength = 191) {
  return (value || "").slice(0, maxLength);
}

async function seed() {
  // Fetch agents
  const agentRes = await fetch(
    "https://valorant-api.com/v1/agents?isPlayableCharacter=true",
  );
  const agentJson = (await agentRes.json()) as { data: ApiAgent[] };
  const agents = agentJson.data;

  // Unique roles
  const uniqueRoles = new Map<string, ApiRole>();

  for (const agent of agents) {
    if (!agent.isPlayableCharacter || !agent.role) continue;

    if (!uniqueRoles.has(agent.role.uuid)) {
      uniqueRoles.set(agent.role.uuid, {
        uuid: agent.role.uuid,
        displayName: agent.role.displayName,
        description: agent.role.description,
        displayIcon: agent.role.displayIcon,
      });
    }
  }

  for (const role of uniqueRoles.values()) {
    await prisma.role.upsert({
      where: { uuid: role.uuid },
      update: {},
      create: role,
    });
  }

  // Agents + abilities
  for (const agent of agents) {
    if (!agent.isPlayableCharacter || !agent.role || !agent.displayName)
      continue;

    const role = await prisma.role.findUnique({
      where: { uuid: agent.role.uuid },
    });
    if (!role) continue;

    const agentRecord = await prisma.agent.upsert({
      where: { uuid: agent.uuid },
      update: {},
      create: {
        uuid: agent.uuid,
        displayName: agent.displayName,
        description: trimText(agent.description),
        developerName: trimText(agent.developerName),
        releaseDate: agent.releaseDate
          ? new Date(agent.releaseDate)
          : new Date(),
        displayIcon: trimText(agent.displayIcon),
        displayIconSmall: trimText(agent.displayIconSmall),
        bustPortrait: trimText(agent.bustPortrait),
        fullPortrait: trimText(agent.fullPortrait),
        fullPortraitV2: trimText(agent.fullPortraitV2),
        killfeedPortrait: trimText(agent.killfeedPortrait),
        background: trimText(agent.background),
        backgroundGradientColors: JSON.stringify(
          agent.backgroundGradientColors || [],
        ),
        roleId: role.id,
      },
    });

    for (const ability of agent.abilities || []) {
      if (!ability.displayName) continue;
      await prisma.ability.create({
        data: {
          agentId: agentRecord.id,
          slot: ability.slot,
          displayName: ability.displayName,
          description: trimText(ability.description),
          displayIcon: trimText(ability.displayIcon),
        },
      });
    }
  }

  // Maps
  const mapRes = await fetch("https://valorant-api.com/v1/maps");
  const mapJson = (await mapRes.json()) as { data: ApiMap[] };

  const excludedUuids = [
    "1f10dab3-4294-3827-fa35-c2aa00213cf3",
    "ee613ee9-28b7-4beb-9666-08db13bb2244",
    "5914d1e0-40c4-cfdd-6b88-eba06347686c",
  ];

  const maps = mapJson.data.filter((map) => !excludedUuids.includes(map.uuid));

  for (const map of maps) {
    if (!map.uuid || !map.displayName || !map.splash) continue;

    await prisma.map.upsert({
      where: { uuid: map.uuid },
      update: {},
      create: {
        uuid: map.uuid,
        displayName: map.displayName,
        tacticalDescription: trimText(map.tacticalDescription),
        coordinates: trimText(map.coordinates),
        displayIcon: trimText(map.displayIcon),
        listViewIcon: trimText(map.listViewIcon),
        listViewIconTall: trimText(map.listViewIconTall),
        splash: trimText(map.splash),
        stylizedBackgroundImage: trimText(map.stylizedBackgroundImage),
        premierBackgroundImage: trimText(map.premierBackgroundImage),
      },
    });
  }

  // Winrate stats Agent
  const winrateDataRaw = await fs.readFile(
    "./prisma/data/agentWinrateStats.json",
    "utf-8",
  );
  const winrateData: { id: number; agent: string; winrate: number }[] =
    JSON.parse(winrateDataRaw);

  for (const stat of winrateData) {
    const agentInDb = await prisma.agent.findUnique({ where: { id: stat.id } });
    if (!agentInDb) {
      console.warn(
        `Agent avec id ${stat.id} (${stat.agent}) non trouvé en base, stat ignorée.`,
      );
      continue;
    }

    // Insert ou update la stat (ici j'assume un historique, donc création toujours)
    await prisma.agentWinrateStat.create({
      data: {
        agentId: stat.id,
        winrate: stat.winrate,
        // recordedAt par défaut à now()
      },
    });
  }

  // Winrate stats Map
  const mapWinrateRaw = await fs.readFile(
    "./prisma/data/mapWinrateStats.json",
    "utf-8",
  );
  const mapWinrateData: {
    map: string;
    mapId: number;
    "atk_win%": number;
    "def_win%": number;
    "top_agents_win%": { agent: string; agentId: number; winrate: number }[];
  }[] = JSON.parse(mapWinrateRaw);

  for (const stat of mapWinrateData) {
    // Trouver la map en base
    const mapInDb = await prisma.map.findUnique({ where: { id: stat.mapId } });
    if (!mapInDb) {
      console.warn(
        `Map avec id ${stat.mapId} (${stat.map}) non trouvée en base, stat ignorée.`,
      );
      continue;
    }

    // Créer la stat map
    const mapStat = await prisma.mapWinrateStat.create({
      data: {
        mapId: stat.mapId,
        atkWinrate: stat["atk_win%"],
        defWinrate: stat["def_win%"],
      },
    });

    // Créer les top agents associés
    for (const topAgent of stat["top_agents_win%"]) {
      const agentInDb = await prisma.agent.findUnique({
        where: { id: topAgent.agentId },
      });
      if (!agentInDb) {
        console.warn(
          `Agent avec id ${topAgent.agentId} (${topAgent.agent}) non trouvé en base, top agent ignoré.`,
        );
        continue;
      }
      await prisma.topAgentWinrate.create({
        data: {
          mapStatId: mapStat.id,
          agentId: topAgent.agentId,
          winrate: topAgent.winrate,
        },
      });
    }
  }

  console.log(
    "✅ Agents, abilities, roles, agents winrate et maps insérés avec succès.",
  );
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
