import type { Room, Side, Agent } from 'drafter-valorant-types';
import fs from 'fs';
import path from 'path';

// Chargement des agents depuis le JSON une seule fois
const agentsJsonPath = path.resolve(__dirname, 'agent.json');
const agentRaw = JSON.parse(fs.readFileSync(agentsJsonPath, 'utf-8'));
const agents: Agent[] = agentRaw.find((e: any) => e.type === 'table' && e.name === 'agent')?.data ?? [];

// Fonction pour tirer N agents uniques
function getUniqueRandomAgents(count: number, exclude: Set<string>) {
const pool = agents.filter((a) => !exclude.has(a.uuid));
if (pool.length < count) throw new Error('Pas assez d’agents uniques disponibles');
const selected: Agent[] = [];
while (selected.length < count) {
const random = pool[Math.floor(Math.random() * pool.length)];
if (!exclude.has(random.uuid)) {
exclude.add(random.uuid);
selected.push(random);
}
}
return selected;
}

function createSide(name: string, exclude: Set<string>): Side {
const agents = getUniqueRandomAgents(5, exclude);
const bans = getUniqueRandomAgents(2, exclude);
return {
name,
team_leader: agents[0].id,
isReady: true,
agents,
bans,
winRate: 0,
};
}

export function createMockRoom(): Room {
const exclude = new Set<string>();
return {
id: 'room-mock-id',
uuid: 'mock-uuid-001',
public_link: 'https://localhost:5173/draft/mock-uuid-001',
map_selected: 1,
state: 'finished',
creator_id: 1,
spectators: [],
draft_session: {
curent_turn: 0,
draft_actions: [],
},
attackers_side: createSide('Attackers', exclude),
defenders_side: createSide('Defenders', exclude),
};
}