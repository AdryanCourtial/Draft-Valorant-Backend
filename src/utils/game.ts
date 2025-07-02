import { Agent, Room, SideTeam, StateDraft } from "drafter-valorant-types";
import { FindFirstNullInArray } from "./utils";
import { prisma } from "../lib/prisma";  

const ArrayOfChampRegistered = (room: Room) => {
    return [
        ...room.attackers_side.agents,
        ...room.attackers_side.bans,
        ...room.defenders_side.agents,
        ...room.defenders_side.bans,
    ];
}

export const VerifyIfChampIsOpen = (room: Room, agent: Agent) => {
    const listChampSelected = ArrayOfChampRegistered(room)

    return listChampSelected.filter(a => a !== null)
    .some(a => a!.id === agent.id);

}

export const ChangeSidePickOrBan = (room: Room, side_to_change: SideTeam, agent: Agent, type: StateDraft) => {

    const array = type === "ban" ? "bans" : "agents"

    const index_agent = FindFirstNullInArray(room[side_to_change][array])
    room[side_to_change][array][index_agent] = agent

}

export const GetCurentTurn = (room: Room) => {
    return room.draft_session.draft_actions.find((value) => {
        return value.turn === room.draft_session.curent_turn
    })
}

export const VerifyIfBanRoleIsTaken = (room: Room, agent: Agent): boolean => {
    const curent_turn = GetCurentTurn(room)

    if (!curent_turn) return false

    return room[curent_turn?.team].bans.some((value) => value?.roleId === agent.roleId)

}

export const RandomizeChamp = async (room: Room): Promise<Agent> => {

    const champion_already_pick = ArrayOfChampRegistered(room)

    var array_id: number[] = []

    champion_already_pick.forEach((value) => {
        if (value === null) {
            return
        }

        array_id.push(value?.id)
    })

    const all_champion = await prisma.agent.findMany()

    const selectable_champ: unknown[] = all_champion.filter((value) => !array_id.includes(value.id))
    
    const index = Math.floor(Math.random() * selectable_champ.length);

    return (selectable_champ[index] as Agent)
}