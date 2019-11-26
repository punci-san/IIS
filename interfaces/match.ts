export interface IMatch {
    id: number;
    tournamentID: number;
    user1: number;
    user2: number;
    team1: number;
    team2: number;
    row: number;
    column: number;
    name1?: string;
    name2?: string;
}
