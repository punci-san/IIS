export interface ITeam {
    id: number;
    creator_id: number;
    name: string;
    description: string;
}

export interface ITeamRequest {
    id: number;
    team_id: number;
    user_id: number;
}
