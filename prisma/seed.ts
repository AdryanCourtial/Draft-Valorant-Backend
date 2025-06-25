
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { ApiMap } from '../src/types/mapsInterface';
import { ApiAgent, ApiRole } from '../src/types/agentInterface';

const prisma = new PrismaClient();

async function seed() {
    // Fetch agents
    const agentRes = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
    const agentJson = await agentRes.json() as { data: ApiAgent[] };
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
      if (!agent.isPlayableCharacter || !agent.role || !agent.displayName) continue;
  
      const role = await prisma.role.findUnique({ where: { uuid: agent.role.uuid } });
      if (!role) continue;
  
      const agentRecord = await prisma.agent.upsert({
        where: { uuid: agent.uuid },
        update: {},
        create: {
          uuid: agent.uuid,
          displayName: agent.displayName,
          description: agent.description || '',
          developerName: agent.developerName || '',
          releaseDate: agent.releaseDate ? new Date(agent.releaseDate) : new Date(),
          displayIcon: agent.displayIcon || '',
          displayIconSmall: agent.displayIconSmall || '',
          bustPortrait: agent.bustPortrait || '',
          fullPortrait: agent.fullPortrait || '',
          fullPortraitV2: agent.fullPortraitV2 || '',
          killfeedPortrait: agent.killfeedPortrait || '',
          background: agent.background || '',
          backgroundGradientColors: JSON.stringify(agent.backgroundGradientColors || []),
          roleId: role.id,
        }
      });
  
      for (const ability of agent.abilities || []) {
        if (!ability.displayName) continue;
        await prisma.ability.create({
          data: {
            agentId: agentRecord.id,
            slot: ability.slot,
            displayName: ability.displayName,
            description: ability.description || '',
            displayIcon: ability.displayIcon || '',
          }
        });
      }
    }
  
    // Maps
    const mapRes = await fetch('https://valorant-api.com/v1/maps');
    const mapJson = await mapRes.json() as { data: ApiMap[] };

    const maps = mapJson.data;
  
    for (const map of maps) {
      if (!map.uuid || !map.displayName || !map.splash) continue;
  
      await prisma.map.upsert({
        where: { uuid: map.uuid },
        update: {},
        create: {
          uuid: map.uuid,
          displayName: map.displayName,
          tacticalDescription: map.tacticalDescription || '',
          coordinates: map.coordinates || '',
          displayIcon: map.displayIcon || '',
          listViewIcon: map.listViewIcon || '',
          listViewIconTall: map.listViewIconTall || '',
          splash: map.splash || '',
          stylizedBackgroundImage: map.stylizedBackgroundImage || '',
          premierBackgroundImage: map.premierBackgroundImage || '',
        }
      });
    }
  
    console.log('✅ Agents, abilities, roles et maps insérés avec succès.');
    await prisma.$disconnect();
  }
  
  seed().catch(e => {
    console.error(e);
    process.exit(1);
  });