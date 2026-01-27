import { getTeamMembers } from "../../lib/services/team-member-service";

export async function load() {
    let crewMembers = [];
    
    crewMembers = await getTeamMembers();

    return {
        crewMembers
    };
}