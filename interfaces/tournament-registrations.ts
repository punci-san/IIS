export interface ITournamentRegistrations {
    id: number;
    tournament_id: number;
    referee: boolean;
    user_id: number;
    team_id: number;
    allowed: boolean;
    name?: string;
}
