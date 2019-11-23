export interface ITournament {
    id: number;
    name: string;
    date_created: Date;
    number_of_players: number; // 4, 8, 16, 32, 64
    team_type: number;         // 0 PvP, 1 Team 2v2, 2 Team 3v3, 3 Team 4v4
    register_fee: number;
    description: string;
    creator_id: number;
    referee_id: number;
    tournament_start: Date;
    sponsors: string;
    // False means that it was just created and true means the players were accepted and matches created
    created: boolean;
}

export enum ITeamType {
    PvP = 0,
    Team_2vs2 = 1,
    Team_3vs3 = 2,
    Team_4vs4 = 3,
}
