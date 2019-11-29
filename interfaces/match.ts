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
    shortcut1?: string;
    name2?: string;
    shortcut2?: string;
    score1: number;
    score2: number;
    finished: boolean;
}
