import supabase from "$lib/supabase";

//traer miembros del equipo
export async function getTeamMembers() {
    const { data, error } = await supabase
      .from("team_member")
      .select("*")
      .order("team_id", { ascending: true });
    if (error) {
        console.error("Error fetching team members:", error);
        return [];
    }

    return data;
}

//editar miembro del equipo
export async function updateTeamMember(id, updatedData) {
    const { data, error } = await supabase
        .from("teamMembers")
        .update(updatedData)
        .eq("id", id);
    if (error) {
        console.error("Error updating team member:", error);
        return null;
    }
    return data;
}