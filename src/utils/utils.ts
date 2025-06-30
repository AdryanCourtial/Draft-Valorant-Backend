import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';
import { Agent, DraftAction, Room, SideTeam, StateDraft } from 'drafter-valorant-types';

// Generates a UUID using the uuid library
export const generateUuid = () => uuidv4();

// Generates a short ID using nanoid with a custom alphabet of 6 characters
const nanoid = customAlphabet('1234567890abcdef', 6);

export const generateShortId = () => nanoid();

export const FindFirstNullInArray = (array: Array<any>) => {
    return array.findIndex((value) => value === null)
}

export const VerifyIfChampIsOpen = (room: Room, agent: Agent) => {
    const listChampSelected = [
    ...room.attackers_side.agents,
    ...room.attackers_side.bans,
    ...room.defenders_side.agents,
    ...room.defenders_side.bans,
    ];

    return listChampSelected.filter(a => a !== null)
    .some(a => a!.id === agent.id);

}

export const ChangeSidePickOrBan = (room: Room, side_to_change: SideTeam, agent: Agent, type: StateDraft) => {

    const array = type === "ban" ? "bans" : "agents"

    const index_agent = FindFirstNullInArray(room[side_to_change][array])
    room[side_to_change][array][index_agent] = agent

}