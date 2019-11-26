export interface IMatchEvent {
    id: number;
    match_id: number;
    team_id: number;
    team_name?: string;
    scorer_id: number;
    scorer_name?: string;
    assister_id: number;
    assister_name?: string;
}
