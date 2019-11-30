import { singleton, container } from "tsyringe";
import mysql from "mysql";
import { IUser } from "../interfaces/user";
import { ITeam, ITeamRequest } from "../interfaces/team";
import { ITournament } from "../interfaces/tournament";
import { ITournamentRegistrations } from "../interfaces/tournament-registrations";
import { IMatch } from "../interfaces/match";
import { ITeamStatistics, IUserStatistics } from "../interfaces/statistics";
import { IMatchEvent } from "../interfaces/match_event";

const dbServer = "localhost";
const user = "xskuta04";
const pass = "edurka6m";
const database = "xskuta04";
const convertToTimestamp = (date: Date): string => {
    const year: number = date.getFullYear();
    const month: number = date.getMonth();
    const day: string = (date.getDate() < 10) ? `0${date.getDate()}` : `${date.getDate()}`;
    return `${year}-${month + 1}-${day} 00:00:00`;
  };

const calculateColumn = (col: number, nop: number): number => {
    let res = nop;
    let count = 0;

    while ( res > 1) {
        res /= 2;
        count++;
    }

    if ((col + 1) <= count) {
        return (col + 1);
    }

    return null;
};

@singleton()
export class Database {
    private connection: mysql.Connection;
    private userDatabase: UserDatabase;
    private teamDatabase: TeamDatabase;
    private teamRequestsDatabase: TeamRequestsDatabase;
    private tournamentDatabase: TournamentDatabase;
    private tournamentRegDatabase: TournamentRegistrationDatabase;
    private matchDatabase: MatchDatabase;
    private matchEventDatabase: MatchEventDatabase;

    constructor() {
        // Connect to database
        this.connection = mysql.createConnection({
            host: dbServer,
            user,
            password: pass,
            database,
        });

        this.userDatabase = container.resolve(UserDatabase);
        this.teamDatabase = container.resolve(TeamDatabase);
        this.matchDatabase = container.resolve(MatchDatabase);
        this.matchEventDatabase = container.resolve(MatchEventDatabase);
        this.teamRequestsDatabase = container.resolve(TeamRequestsDatabase);
        this.tournamentDatabase = container.resolve(TournamentDatabase);
        this.tournamentRegDatabase = container.resolve(TournamentRegistrationDatabase);

        this.connection.connect((err: mysql.MysqlError) => {
            if (err === null) {
                this.userDatabase.setConnection(this.connection);
                this.teamDatabase.setConnection(this.connection);
                this.matchDatabase.setConnection(this.connection);
                this.matchEventDatabase.setConnection(this.connection);
                this.teamRequestsDatabase.setConnection(this.connection);
                this.tournamentDatabase.setConnection(this.connection);
                this.tournamentRegDatabase.setConnection(this.connection);
            }
        });
    }

    public authenticate(username: string, password: string): Promise<any> {
        return this.userDatabase.authenticate(username, password);
    }

    public register(username: string, password: string, admin: boolean): Promise<any> {
        return this.userDatabase.register(username, password, admin);
    }

    public userExist(username: string): Promise<any> {
        return this.userDatabase.userExist(username);
    }

    public getUsers(): Promise<any> {
        return this.userDatabase.getUsers();
    }

    public getUser(id: number): Promise<any> {
        return this.userDatabase.getUser(id);
    }

    public updateUser(id: number, username: string, password: string, team: number, admin: boolean, description: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.userDatabase.updateUser(id, username, password, team, admin, description)
            .then(() => {
                this.getUser(id)
                .then((usr: IUser) => {
                    return resolve(usr);
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public deleteUser(id: number): Promise<any> {
        return new Promise((resolve, reject) => {
            // Remove user
            this.userDatabase.deleteUser(id)
            .then(() => {
                // Remove all team requests made by user
                this.teamRequestsDatabase.deleteTeamRequestByUserID(id)
                .then(() => {
                    return resolve();
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public leaveTeam(teamID: number): Promise<any> {
        return this.userDatabase.leaveTeam(teamID);
    }

    public getTeamUsers(teamID: number): Promise<any> {
        return this.userDatabase.getTeamuserS(teamID);
    }

    public banUser(userID: number): Promise<void> {
        return this.userDatabase.banUser(userID);
    }

    public unBanUser(userID: number): Promise<void> {
        return this.userDatabase.unBanUser(userID);
    }

    /**
     * TEAMS
     */

    public addTeam(name: string, shortcut: string, userObject: IUser, fileName: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.teamDatabase.addTeam(name, shortcut, userObject.id, fileName)
            .then((id: number) => {
                // Add user to given team
                this.updateUser(userObject.id, null, null, id, null, null)
                .then(() => {
                    return resolve(id);
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public getTeams(): Promise<any> {
        return this.teamDatabase.getTeams();
    }

    public getTeam(id: number): Promise<any> {
        return this.teamDatabase.getTeam(id);
    }

    public changeTeamAdmin(teamID: number, userID: number): Promise<any> {
        return new Promise((resolve, reject) => {
            // Check if user exist
            this.userDatabase.getUser(userID)
            .then(() => {
                // Update team
                this.teamDatabase.updateTeam(teamID, null, userID)
                .then(() => {
                    // Get updated team and return
                    this.teamDatabase.getTeam(teamID)
                    .then((team: ITeam) => {
                        return resolve(team);
                    })
                    .catch(() => {
                        return reject();
                    });
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public deleteTeam(id: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.userDatabase.leaveTeam(id)
            .then(() => {
                this.teamDatabase.deleteTeam(id)
                .then(() => {
                    this.teamRequestsDatabase.deleteTeamRequestByTeamID(id)
                    .then(() => {
                        return resolve();
                    })
                    .catch(() => {
                        return reject();
                    });
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public kickUser(userID: number, teamID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            // Get user
            this.userDatabase.getUser(userID)
            .then((usr: IUser) => {
                // Not from this team
                if (usr.team !== teamID) {
                    return reject();
                }

                // Update user
                this.userDatabase.updateUser(userID, null, null, null, null, null)
                .then(() => {
                    return resolve();
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    /**
     * TEAM REQUESTS
     */

    public addTeamRequest(teamID: number, userID: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.userDatabase.getUser(userID)
            .then(() => {
                this.teamDatabase.getTeam(teamID)
                .then(() => {
                    this.teamRequestsDatabase.addTeamRequest(teamID, userID)
                    .then(() => {
                        return resolve();
                    })
                    .catch(() => {
                        return reject();
                    });
                }).catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public getTeamRequests(teamID: number): Promise<ITeamRequest[]> {
        return this.teamRequestsDatabase.getTeamRequests(teamID);
    }

    public acceptTeamRequest(teamRequestID: number): Promise<any> {
        return new Promise((resolve, reject) => {
            // Get already created request
            this.teamRequestsDatabase.getTeamRequest(teamRequestID)
            .then((teamRequest: ITeamRequest) => {
                // Check if team exist
                this.teamDatabase.getTeam(teamRequest.team_id)
                .then(() => {
                    // Check if user exist
                    this.userDatabase.getUser(teamRequest.user_id)
                    .then((userObj: IUser) => {
                        // Update user
                        this.userDatabase.updateUser(userObj.id, null, null, teamRequest.team_id, null, null)
                        .then(() => {
                            // Delete request
                            this.teamRequestsDatabase.deleteTeamRequestByID(teamRequestID)
                            .then(() => {
                                return resolve();
                            })
                            .catch(() => {
                                return reject();
                            });
                        })
                        .catch(() => {
                            return reject();
                        });
                    })
                    .catch(() => {
                        return reject();
                    });
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public deleteTeamRequest(teamRequestID: number): Promise<void> {
        return this.teamRequestsDatabase.deleteTeamRequestByID(teamRequestID);
    }

    /**
     * TOURNAMENT REQUESTS
     */

     public getTournaments(): Promise<ITournament[]> {
         return this.tournamentDatabase.getTournaments();
     }

     public getTournament(tournamentID: number): Promise<ITournament> {
        return this.tournamentDatabase.getTournament(tournamentID);
    }

     public addTournament(
        name: string,
        dateCreated: Date,
        numberOfPlayers: number,
        teamType: number,
        registerFee: number,
        description: string,
        creatorID: number,
        tournamentStart: Date,
        sponsors: string,
     ): Promise<any> {
         return this.tournamentDatabase.addTournament(
             name,
             dateCreated,
             numberOfPlayers,
             teamType,
             registerFee,
             description,
             creatorID,
             tournamentStart,
             sponsors,
             );
     }

     public deleteTournament(tournamentID: number): Promise<void> {
         return new Promise((resolve, reject) => {
            this.tournamentRegDatabase.deleteTournamentReg(tournamentID)
            .then(() => {
                this.tournamentDatabase.deleteTournament(tournamentID)
                .then(() => {
                    return resolve();
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
         });
     }

     public clearTournamentReferee(tournamentID: number): Promise<void> {
         return this.tournamentDatabase.clearTournamentReferee(tournamentID);
     }

     public updateTournamentCreation(tournamentID: number, created: boolean): Promise<void> {
         return this.tournamentDatabase.updateTournamentCreation(tournamentID, created);
     }

     /**
      * TOURNAMENT REGISTRATION REQUESTS
      */

    public getTournamentRegistrations(tournamentID: number): Promise<ITournamentRegistrations[]> {
        return this.tournamentRegDatabase.getAll(tournamentID);
    }

    public addTournamentReg(tournamentID: number, userID: number, teamID: number, referee: boolean): Promise<number> {
        return this.tournamentRegDatabase.add(tournamentID, userID, teamID, referee);
    }

    public clearTournamentReg(tournamentID: number, userID: number, teamID: number): Promise<void> {
        return this.tournamentRegDatabase.clearReg(tournamentID, userID, teamID);
    }

    public acceptTournamentRegReferee(tournamentID: number, userID: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.tournamentDatabase.addReferee(tournamentID, userID)
            .then(() => {
                this.tournamentRegDatabase.denyAllRefereesTourReg(tournamentID)
                .then(() => {
                    this.tournamentRegDatabase.allowDenyTournamentReg(tournamentID, userID, null, true)
                    .then(() => {
                        return resolve();
                    })
                    .catch(() => {
                        return reject();
                    });
                })
                .catch(() => {
                return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public denyTournamentRegReferee(tournamentID: number, userID: number): Promise<any> {
        return this.tournamentRegDatabase.allowDenyTournamentReg(tournamentID, userID, null, false);
    }

    public acceptTournamentReg(tournamentID: number, userID: number, teamID: number): Promise<any> {
        return this.tournamentRegDatabase.allowDenyTournamentReg(tournamentID, userID, teamID, true);
    }

    public denyTournamentReg(tournamentID: number, userID: number, teamID: number): Promise<any> {
        return this.tournamentRegDatabase.allowDenyTournamentReg(tournamentID, userID, teamID, false);
    }

    public countAcceptedRegs(tournamentID: number, countTeams: boolean): Promise<number> {
        return this.tournamentRegDatabase.countAcceptedReg(tournamentID, countTeams);
    }

    /**
     * Match requests
     */

    public addMatch(tournamentID: number, user1: number, user2: number, team1: number, team2: number, row: number, column: number): Promise<number> {
        return this.matchDatabase.addMatch(tournamentID, user1, user2, team1, team2, row, column);
    }

    public incrementScore(matchID: number, teamID: number, scorerID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.getMatch(matchID)
            .then((m: IMatch) => {
                // Get scores
                let score1: number = m.score1;
                let score2: number = m.score2;

                // User only match
                if (teamID === null) {
                    if (m.user1 === scorerID) {
                        score1++;
                    } else if (m.user2 === scorerID) {
                        score2++;
                    } else {
                        return reject();
                    }
                } else {
                    if (m.team1 === teamID) {
                        score1++;
                    } else if (m.team2 === teamID) {
                        score2++;
                    } else {
                        return reject();
                    }
                }

                this.matchDatabase.updateScores(matchID, score1, score2)
                .then(() => {
                    return resolve();
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public decrementScore(matchID: number, teamID: number, scorerID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.getMatch(matchID)
            .then((m: IMatch) => {
                // Get scores
                let score1: number = m.score1;
                let score2: number = m.score2;

                // User only match
                if (teamID === null) {
                    if (m.user1 === scorerID) {
                        score1 = ((score1 - 1) < 0) ? 0 : (score1 - 1);
                    } else if (m.user2 === scorerID) {
                        score2 = ((score2 - 1) < 0) ? 0 : (score2 - 1);
                    } else {
                        return reject();
                    }
                } else {
                    if (m.team1 === teamID) {
                        score1 = ((score1 - 1) < 0) ? 0 : (score1 - 1);
                    } else if (m.team2 === teamID) {
                        score2 = ((score2 - 1) < 0) ? 0 : (score2 - 1);
                    } else {
                        return reject();
                    }
                }
                this.matchDatabase.updateScores(matchID, score1, score2)
                .then(() => {
                    return resolve();
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public getMatches(tournamentID: number): Promise<IMatch[]> {
        return this.matchDatabase.getMatches(tournamentID);
    }

    public getMatch(matchID: number): Promise<IMatch> {
        return this.matchDatabase.getMatch(matchID);
    }

    public deleteMatch(matchID: number): Promise<void> {
        return this.matchDatabase.deleteMatch(matchID);
    }

    public endMatch(tournamentID: number, matchID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.matchDatabase.endMatch(matchID)
            .then(() => {
                this.getTournament(tournamentID)
                .then((t: ITournament) => {
                    console.log(t);

                    this.matchDatabase.getMatches(tournamentID)
                    .then((ms: IMatch[]) => {
                        console.log(ms);
                        const finishedMatches: IMatch[] = ms.filter((m: IMatch) => m.finished === true);
                        const match1: IMatch = finishedMatches.find((m: IMatch) => m.id === matchID);

                        if (match1 === undefined) {
                            return reject();
                        }

                        const column: number = match1.column;
                        const row: number = (match1.row % 2 === 0) ? match1.row + 1 : match1.row - 1;

                        console.log(column, row);

                        const match2: IMatch = finishedMatches.find((m: IMatch) => m.column === column && m.row === row);

                        if (match2 === undefined) {
                            return resolve();
                        }

                        let team1Win: number = null;
                        let team2Win: number = null;
                        let usr1Win: number = null;
                        let usr2Win: number = null;

                        // User match
                        if (match1.team1 === null && match1.team2 === null && match2.team1 === null && match2.team2 === null) {
                            usr1Win = (match1.score1 > match1.score2) ? match1.user1 : match1.user2;
                            usr2Win = (match2.score1 > match2.score2) ? match2.user1 : match2.user2;
                        } else if (match1.user1 === null && match1.user2 === null && match2.user1 === null && match2.user2 === null) {
                            team1Win = (match1.score1 > match1.score2) ? match1.team1 : match1.team2;
                            team2Win = (match2.score1 > match2.score2) ? match2.team1 : match2.team2;
                        } else {
                            return reject();
                        }

                        const nColumn: number = calculateColumn(column, t.number_of_players);
                        const nRow: number =  Math.floor(row / 2);

                        if (nColumn === null) {
                            return resolve();
                        }

                        console.log(tournamentID, usr1Win, usr2Win, team1Win, team2Win, nColumn, nRow);

                        this.addMatch(tournamentID, usr1Win, usr2Win, team1Win, team2Win, nRow, nColumn)
                        .then(() => {
                            return resolve();
                        })
                        .catch(() => {
                            return reject();
                        });
                    })
                    .catch(() => {
                        return reject();
                    });
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    /**
     * Match event requests
     */

    public addMatchEvent(matchID: number, teamID: number, scorerID: number, assisterID: number): Promise<number> {
        return new Promise((resolve, reject) => {
            this.matchEventDatabase.addEvent(matchID, teamID, scorerID, assisterID)
            .then((id: number) => {
                this.incrementScore(matchID, teamID, scorerID)
                .then(() => {
                    return resolve(id);
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    public getMatchEvent(matchEventID: number): Promise<IMatchEvent> {
        return this.matchEventDatabase.getMatchEvent(matchEventID);
    }

    public getMatchEvents(matchID: number): Promise<IMatchEvent[]> {
        return this.matchEventDatabase.getMatchEvents(matchID);
    }

    public deleteMatchEvent(matchEventID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.matchEventDatabase.getMatchEvent(matchEventID)
            .then((me: IMatchEvent) => {
                this.decrementScore(me.match_id, me.team_id, me.scorer_id)
                .then(() => {
                    this.matchEventDatabase.deleteEvent(matchEventID)
                    .then(() => {
                        return resolve();
                    })
                    .catch(() => {
                        return reject();
                    });
                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }

    /**
     * Statistics
     */

    public getUserStatistics(userID: number): Promise<IUserStatistics> {
        return new Promise((resolve, reject) => {
            this.matchDatabase.getMatchesByUser(userID)
            .then((ms: IMatch[]) => {
                this.matchEventDatabase.getMatchEventsByUser(userID)
                .then((mes: IMatchEvent[]) => {
                    const userStatistics: IUserStatistics = {
                        matchesPlayed: 0,
                        matchesWin: 0,
                        matchesLost: 0,
                        scores: 0,
                        assistances: 0,
                    };

                    for (const m of ms) {
                        userStatistics.matchesPlayed++;

                        if (m.user1 === userID) {
                            if (m.score1 > m.score2) {
                                userStatistics.matchesWin++;
                            } else {
                                userStatistics.matchesLost++;
                            }
                        }

                        if (m.user2 === userID) {
                            if (m.score1 < m.score2) {
                                userStatistics.matchesWin++;
                            } else {
                                userStatistics.matchesLost++;
                            }
                        }
                    }

                    for (const me of mes) {
                        if (me.scorer_id === userID) {
                            userStatistics.scores++;
                        }

                        if (me.assister_id === userID) {
                            userStatistics.assistances++;
                        }
                    }

                    return resolve(userStatistics);

                })
                .catch(() => {
                    console.log("MatchesEvent getting failed.");
                    return reject();
                });
            })
            .catch(() => {
                console.log("Matches getting failed.");
                return reject();
            });
        });
    }

    public getTeamStatistics(teamID: number): Promise<ITeamStatistics> {
        return new Promise((resolve, reject) => {
            this.matchDatabase.getMatchesByTeam(teamID)
            .then((ms: IMatch[]) => {
                this.matchEventDatabase.getMatchEventsByTeam(teamID)
                .then((mes: IMatchEvent[]) => {
                    const userStatistics: ITeamStatistics = {
                        matchesPlayed: 0,
                        matchesWin: 0,
                        matchesLost: 0,
                        scores: 0,
                        assistances: 0,
                        bestScoreUserID: null,
                        bestScoreUserName: "",
                    };

                    for (const m of ms) {
                        userStatistics.matchesPlayed++;

                        if (m.team1 === teamID) {
                            if (m.score1 > m.score2) {
                                userStatistics.matchesWin++;
                            } else {
                                userStatistics.matchesLost++;
                            }
                        }

                        if (m.team2 === teamID) {
                            if (m.score1 < m.score2) {
                                userStatistics.matchesWin++;
                            } else {
                                userStatistics.matchesLost++;
                            }
                        }
                    }

                    for (const me of mes) {
                        if (me.team_id === teamID) {
                            if (me.scorer_id !== null) {
                                userStatistics.scores++;
                            }
                            if (me.assister_id !== null) {
                                userStatistics.assistances++;
                            }
                        }
                    }

                    return resolve(userStatistics);

                })
                .catch(() => {
                    return reject();
                });
            })
            .catch(() => {
                return reject();
            });
        });
    }
}

@singleton()
class UserDatabase {
    private connection: mysql.Connection;

    constructor() {
        this.connection = null;
    }

    public setConnection(conn: mysql.Connection): void {
        this.connection = conn;
    }

    public banUser(userID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            // UPDATE `users` SET `name` = 'aaaaaaa' WHERE `users`.`id` = 1;
            this.connection.query(`UPDATE users SET banned=true WHERE id = '${userID}';`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }

    public unBanUser(userID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            // UPDATE `users` SET `name` = 'aaaaaaa' WHERE `users`.`id` = 1;
            this.connection.query(`UPDATE users SET banned=false WHERE id = '${userID}';`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }

    public authenticate(username: string, password: string): Promise<IUser> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            // SELECT * FROM 'users' WHERE name='xskuta04' AND pass='jebojo9mon';
            this.connection.query(`SELECT * FROM users WHERE name='${username}' AND pass='${password}'`,
            (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result.length !== 1) {
                    return reject();
                }

                return resolve({
                    id: result[0].id,
                    name: result[0].name,
                    team: result[0].team_id,
                    admin: (result[0].admin !== null && result[0].admin === 1) ? true : false,
                    description: result[0].description,
                    banned: (result[0].banned !== null && result[0].banned === 1) ? true : false,
                });
            });
        });
    }

    public register(username: string, password: string, admin: boolean = false): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            // Check if user exist
            this.userExist(username)
            // Username is already in use
            .then(() => {
                return reject();
            })
            // Add new user
            .catch(() => {
                this.connection.query(`INSERT INTO users (name, pass, admin) VALUES ('${username}', '${password}', ${admin})`,
                (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                    if (err !== null) {
                        return reject();
                    }

                    if (result === null) {
                        return reject();
                    }

                    if (result.affectedRows !== undefined && result.affectedRows > 0) {
                        return resolve();
                    }

                    return reject();
                });
            });
        });
    }

    public getUsers(): Promise<IUser[]> {
        return new Promise((resolve, reject) => {
            const users: IUser[] = [];
            if (this.connection === null) {
                return reject();
            }
            this.connection.query("SELECT * FROM users", (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                for (const res of result) {
                    users.push({
                        id: res.id,
                        name: res.name,
                        admin: (res.admin !== null && res.admin === 1) ? true : false,
                        team: res.team_id,
                        description: res.description,
                        banned: (res.banned !== null && res.banned === 1) ? true : false,
                    });
                }

                return resolve(users);
            });
        });
    }

    public getUser(userId: number): Promise<IUser> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            this.connection.query(`SELECT * FROM users WHERE id='${userId}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                if (result.length === 1) {
                    return resolve({
                        id: result[0].id,
                        name: result[0].name,
                        admin: (result[0].admin !== null && result[0].admin === 1) ? true : false,
                        team: result[0].team_id,
                        description: result[0].description,
                        banned: (result[0].banned !== null && result[0].banned === 1) ? true : false,
                    });
                }

                return reject();
            });
        });
    }

    public updateUser(id: number, username: string, password: string, team: number, admin: boolean, description: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            let uUsername = "";
            let uPassword = "";
            let uTeam = "";
            let uDescription = "";
            let uAdmin = "admin=false";

            if (username !== null) {
                uUsername = `name='${username}',`;
            }

            if (password !== null) {
                uPassword = `pass='${password}',`;
            }

            if (team !== null) {
                uTeam = `team_id='${team}',`;
            } else {
                uTeam = "team_id=null,";
            }

            if (admin !== null) {
                admin = Boolean(admin);
                if (admin === true) {
                    uAdmin = "admin=true";
                } else {
                    uAdmin = "admin=false";
                }
            }

            if (description !== null) {
                uDescription = `description='${description}',`;
            }

            // UPDATE `users` SET `name` = 'aaaaaaa' WHERE `users`.`id` = 1;
            this.connection.query(`UPDATE users SET ${uUsername} ${uPassword} ${uTeam} ${uDescription} ${uAdmin} WHERE id = '${id}';`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }

    public deleteUser(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            // DELETE FROM `users` WHERE `users`.`id` = 1
            this.connection.query(`DELETE FROM users WHERE id= '${id}';`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                return resolve(result);
            });
        });
    }

    public leaveTeam(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            // UPDATE `users` SET `name` = 'aaaaaaa' WHERE `users`.`id` = 1;
            this.connection.query(`UPDATE users SET team_id =null WHERE team_id='${id}';`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                return resolve();
            });
        });
    }

    public getTeamuserS(id: number): Promise<IUser[]> {
        return new Promise((resolve, reject) => {
            const users: IUser[] = [];
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`SELECT * FROM users WHERE team_id='${id}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                for (const res of result) {
                    users.push({
                        id: res.id,
                        name: res.name,
                        admin: (res.admin !== null && res.admin === 1) ? true : false,
                        team: res.team_id,
                        description: res.description,
                        banned: (res.banned !== null && res.banned === 1) ? true : false,
                    });
                }

                return resolve(users);
            });
        });
    }

    public userExist(username: string): Promise<IUser> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`SELECT * FROM users where name='${username}';`,
                (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                    if (err !== null) {
                        return reject();
                    }

                    if (result !== undefined && result.length > 0) {
                        return resolve({
                            id: result[0].id,
                            admin: (result[0].admin !== null && result[0].admin === 1) ? true : false,
                            name: result[0].name,
                            team: result[0].team_id,
                            description: result[0].description,
                            banned: (result[0].banned !== null && result[0].banned === 1) ? true : false,
                        } as IUser);
                    }

                    return reject();
            });
        });
    }
}

@singleton()
class TeamDatabase {
    private connection: mysql.Connection;

    constructor() {
        this.connection = null;
    }

    public setConnection(conn: mysql.Connection): void {
        this.connection = conn;
    }

    public getTeams(): Promise<ITeam[]> {
        return new Promise((resolve, reject) => {
            const teams: ITeam[] = [];
            if (this.connection === null) {
                return reject();
            }
            this.connection.query("SELECT * FROM teams", (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                for (const res of result) {
                    teams.push({
                        id: res.id,
                        creator_id : res.creator_id ,
                        name: res.name,
                        description: res.description,
                        file_name: res.file_name,
                        shortcut: res.shortcut,
                    });
                }

                return resolve(teams);
            });
        });
    }

    public getTeam(id: number): Promise<ITeam> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`SELECT * FROM teams WHERE id='${id}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result.length === 1) {
                    return resolve({
                        id: result[0].id,
                        name: result[0].name,
                        description: result[0].description,
                        creator_id : result[0].creator_id,
                        file_name: result[0].file_name,
                        shortcut: result[0].shortcut,
                    } as ITeam);
                }

                return reject();
            });
        });
    }

    public updateTeam(teamID: number, name: string, creatorID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            let uName = "";
            let uCreator = "";

            if (name !== null) {
                uName = `name='${name}'`;
            }

            if (creatorID !== null) {
                if (name !== null) {
                    uCreator = ", ";
                }
                uCreator = `${uCreator}creator_id='${creatorID}'`;
            }

            this.connection.query(`UPDATE teams SET ${uName} ${uCreator} WHERE id = '${teamID}';`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }

    public updateImage(teamID: number, fileName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`UPDATE teams SET file_name='${fileName}' WHERE id = '${teamID}';`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }

    public addTeam(name: string, shortcut: string, creatorId: number, fileName): Promise<number> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            // Check if user exist
            this.teamExist(name)
            // Username is already in use
            .then(() => {
                return reject();
            })
            // Add new user
            .catch(() => {
                this.connection.query(`INSERT INTO teams (name, shortcut, creator_id, file_name) VALUES
                ('${name}', '${shortcut}', '${creatorId}', '${fileName}');`,
                (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                    if (err !== null) {
                        return reject();
                    }

                    if (result === null) {
                        return reject();
                    }

                    if (result.affectedRows !== undefined && result.affectedRows > 0) {
                        return resolve(result.insertId);
                    }

                    return reject();
                });
            });
        });
    }

    public deleteTeam(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            this.connection.query(`DELETE FROM teams WHERE id='${id}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                return resolve();
            });
        });
    }

    private teamExist(name: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`SELECT * FROM teams where name='${name}'`,
                (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                    if (err !== null) {
                        return reject();
                    }

                    if (result !== undefined && result.length > 0) {
                        return resolve();
                    }

                    return reject();
            });
        });
    }
}

@singleton()
class TeamRequestsDatabase {
    private connection: mysql.Connection;

    constructor() {
        this.connection = null;
    }

    public setConnection(conn: mysql.Connection): void {
        this.connection = conn;
    }

    public addTeamRequest(teamID: number, userID: number): Promise<number> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.teamRequestExist(teamID, userID)
            .then(() => {
                return reject();
            })
            .catch(() => {
                this.connection.query(`INSERT INTO team_requests (team_id, user_id ) VALUES ('${teamID}', '${userID}')`,
                (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                    if (err !== null) {
                        return reject();
                    }

                    if (result === null) {
                        return reject();
                    }

                    if (result.affectedRows !== undefined && result.affectedRows > 0) {
                        return resolve(result.insertId);
                    }

                    return reject();
                });
            });
        });
    }

    public getTeamRequest(id: number): Promise<ITeamRequest> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`SELECT * FROM team_requests WHERE id='${id}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                if (result.length === 0) {
                    return reject();
                }

                return resolve({
                    id: result[0].id,
                    user_id: result[0].user_id,
                    team_id: result[0].team_id,
                });
            });
        });
    }

    public getTeamRequests(id: number): Promise<ITeamRequest[]> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            const teamRequests: ITeamRequest[] = [];
            let query = "";

            if (id !== null) {
                query = ` WHERE team_id='${id}'`;
            }

            this.connection.query(`SELECT * FROM team_requests ${query}`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                for (const res of result) {
                    teamRequests.push({
                        id: res.id,
                        user_id : res.user_id ,
                        team_id: res.team_id,
                    });
                }

                return resolve(teamRequests);
            });
        });
    }

    public deleteTeamRequestByID(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            this.connection.query(`DELETE FROM team_requests WHERE id='${id}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                return resolve();
            });
        });
    }

    public deleteTeamRequestByUserID(userID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`DELETE FROM team_requests WHERE user_id='${userID}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                return resolve();
            });
        });
    }

    public deleteTeamRequestByTeamID(teamID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`DELETE FROM team_requests WHERE team_id='${teamID}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                return resolve();
            });
        });
    }

    public teamRequestExist(teamID: number, userID: number): Promise<ITeamRequest> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`SELECT * FROM team_requests WHERE team_id='${teamID}' AND user_id='${userID}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                if (result.length === 0) {
                    return reject();
                }

                return resolve({
                    id: result[0].id,
                    user_id: result[0].user_id,
                    team_id: result[0].team_id,
                });
            });
        });
    }
}

@singleton()
class TournamentDatabase {
    private connection: mysql.Connection;

    constructor() {
        this.connection = null;
    }

    public setConnection(conn: mysql.Connection): void {
        this.connection = conn;
    }

    public addTournament(name: string, dateCreated: Date, numberOfPlayers: number, teamType: number, registerFee: number, description: string, creatorID: number, tournamentStart: Date, sponsors: string): Promise<number> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(
                `INSERT INTO tournaments
                (
                    name,
                    date_created,
                    number_of_players,
                    team_type,
                    register_fee,
                    description,
                    creator_id,
                    tournament_start,
                    sponsors
                    ) VALUES (
                        '${name}',
                        '${convertToTimestamp(new Date(dateCreated))}',
                        '${numberOfPlayers}',
                        '${teamType}',
                        '${registerFee}',
                        '${description}',
                        '${creatorID}',
                        '${convertToTimestamp(new Date(tournamentStart))}',
                        '${sponsors}')`,
            (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result.affectedRows !== undefined && result.affectedRows > 0) {
                    return resolve(result.insertId);
                }

                return reject();
            });
        });
    }

    public addReferee(tournamentID: number, userID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            // UPDATE `users` SET `name` = 'aaaaaaa' WHERE `users`.`id` = 1;
            this.connection.query(`UPDATE tournaments SET referee_id='${userID}' WHERE id = '${tournamentID}';`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }

    public getTournaments(): Promise<ITournament[]> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            const tournaments: ITournament[] = [];

            this.connection.query("SELECT * FROM tournaments", (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                for (const res of result) {
                    tournaments.push({
                        id: res.id,
                        name: res.name,
                        date_created: res.date_created,
                        number_of_players: res.number_of_players,
                        team_type: res.team_type,
                        register_fee: res.register_fee,
                        description: res.description,
                        creator_id: res.creator_id,
                        referee_id: res.referee_id,
                        tournament_start: res.tournament_start,
                        created: (res.created === 0) ? false : true,
                        sponsors: res.sponsors,
                    });
                }

                return resolve(tournaments);
            });
        });
    }

    public getTournament(tournamentID: number): Promise<ITournament> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`SELECT * FROM tournaments WHERE id='${tournamentID}' LIMIT 1`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                if (result.length !== 1) {
                    return reject();
                }

                return resolve({
                    id: result[0].id,
                    name: result[0].name,
                    date_created: result[0].date_created,
                    number_of_players: result[0].number_of_players,
                    team_type: result[0].team_type,
                    register_fee: result[0].register_fee,
                    description: result[0].description,
                    creator_id: result[0].creator_id,
                    referee_id: result[0].referee_id,
                    tournament_start: result[0].tournament_start,
                    created: (result[0].created === null) ? null : (result[0].created === 0) ? false : true,
                    sponsors: result[0].sponsors,
                });
            });
        });
    }

    public updateTournamentCreation(tournamentID: number, created: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            const uCreated = (created === true) ? "true" : "false";

            this.connection.query(`UPDATE tournaments SET created=${uCreated} WHERE id='${tournamentID}';`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }

    public clearTournamentReferee(tournamentID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            // UPDATE `users` SET `name` = 'aaaaaaa' WHERE `users`.`id` = 1;
            this.connection.query(`UPDATE tournaments SET referee_id=NULL WHERE id = '${tournamentID}';`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }

    public deleteTournament(tournamentID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`DELETE FROM tournaments WHERE id='${tournamentID}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }
}

@singleton()
class TournamentRegistrationDatabase {
    private connection: mysql.Connection;

    constructor() {
        this.connection = null;
    }

    public setConnection(conn: mysql.Connection): void {
        this.connection = conn;
    }

    public add(tournamentID: number, userID: number, teamID: number, referee: boolean): Promise<number> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            const uReferee: string = (referee) ? "true" : "false";
            const uUserID: string = (userID === null) ? "null" : `'${userID}'`;
            const uTeamID: string = (teamID === null) ? "null" : `'${teamID}'`;

            this.connection.query(
                `INSERT INTO tournament_registrations (tournament_id, referee, user_id, team_id) VALUES
                ('${tournamentID}',${uReferee},${uUserID},${uTeamID})`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result.affectedRows !== undefined && result.affectedRows > 0) {
                    return resolve(result.insertId);
                }

                return reject();
            });
        });
    }

    public clearReg(tournamentID: number, userID: number, teamID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            const searchQuery = (userID !== null) ? `user_id='${userID}'` : (teamID !== null) ? `team_id='${teamID}'` : null;

            if (searchQuery === null) {
                return reject();
            }

            // UPDATE `users` SET `name` = 'aaaaaaa' WHERE `users`.`id` = 1;
            this.connection.query(`UPDATE tournament_registrations SET allowed=NULL WHERE tournament_id = '${tournamentID}' AND ${searchQuery};`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }

    public getAll(tournamentID: number): Promise<ITournamentRegistrations[]> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            const tournaments: ITournamentRegistrations[] = [];

            this.connection.query(`SELECT * FROM tournament_registrations WHERE tournament_id='${tournamentID}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                for (const res of result) {
                    tournaments.push({
                        id: res.id,
                        user_id: res.user_id,
                        team_id: res.team_id,
                        referee: (res.referee !== null && res.referee === 1) ? true : false,
                        tournament_id: res.tournament_id,
                        allowed: (res.allowed === null) ? null : (res.allowed === 0) ? false : true,
                    });
                }

                return resolve(tournaments);
            });
        });
    }

    public denyAllRefereesTourReg(tournamentID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            // UPDATE `users` SET `name` = 'aaaaaaa' WHERE `users`.`id` = 1;
            this.connection.query(`UPDATE tournament_registrations SET allowed=false WHERE tournament_id = '${tournamentID}' AND referee=true`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                return resolve();
            });
        });
    }

    public countAcceptedReg(tournamentID: number, countTeams: boolean): Promise<number> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            const countQuery = (countTeams) ? "team_id != NULL" : "user_id != NULL";

            // UPDATE `users` SET `name` = 'aaaaaaa' WHERE `users`.`id` = 1;
            this.connection.query(`SELECT id FROM tournament_registrations WHERE tournament_id = '${tournamentID}' AND allowed=true AND ${countQuery}`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                return resolve(result.length);
            });
        });
    }

    public allowDenyTournamentReg(tournamentID: number, userID: number, teamID: number, allow: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            const allowed = (allow === true) ? "true" : "false";
            const searchQuery = (userID !== null) ? `user_id='${userID}'` : (teamID !== null) ? `team_id='${teamID}'` : null;

            if (searchQuery === null) {
                return reject();
            }

            // UPDATE `users` SET `name` = 'aaaaaaa' WHERE `users`.`id` = 1;
            this.connection.query(`UPDATE tournament_registrations SET allowed=${allowed} WHERE tournament_id = '${tournamentID}' AND ${searchQuery};`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }

    public deleteTournamentReg(tournamentID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`DELETE FROM tournament_registrations WHERE tournament_id='${tournamentID}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                return resolve();
            });
        });
    }
}

@singleton()
class MatchDatabase {
    private connection: mysql.Connection;

    constructor() {
        this.connection = null;
    }

    public setConnection(conn: mysql.Connection): void {
        this.connection = conn;
    }

    public addMatch(tournamentID: number, user1: number, user2: number, team1: number, team2: number, row: number, column: number): Promise<number> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            const uUser1: string = (user1 === null) ? "null" : `'${user1}'`;
            const uUser2: string = (user2 === null) ? "null" : `'${user2}'`;
            const uTeam1: string = (team1 === null) ? "null" : `'${team1}'`;
            const uTeam2: string = (team2 === null) ? "null" : `'${team2}'`;

            this.connection.query(
                `INSERT INTO matches (tournament_id, user_1, user_2, team_1, team_2, tournament_row, tournament_column) VALUES
                ('${tournamentID}',${uUser1},${uUser2},${uTeam1},${uTeam2},'${row}','${column}');`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result.affectedRows !== undefined && result.affectedRows > 0) {
                    return resolve(result.insertId);
                }

                return reject();
            });
        });
    }

    public getMatches(tournamentID: number): Promise<IMatch[]> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            const matches: IMatch[] = [];

            this.connection.query(`SELECT * FROM matches WHERE tournament_id='${tournamentID}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                for (const res of result) {
                    matches.push({
                        id: res.id,
                        user1: (res.user_1 === null) ? null : res.user_1,
                        user2: (res.user_2 === null) ? null : res.user_2,
                        team1: (res.team_1 === null) ? null : res.team_1,
                        team2: (res.team_2 === null) ? null : res.team_2,
                        tournamentID: res.tournament_id,
                        row: res.tournament_row,
                        column: res.tournament_column,
                        score1: res.score1,
                        score2: res.score2,
                        finished: (res.finished === 1) ? true : false,
                    });
                }

                return resolve(matches);
            });
        });
    }

    public getMatchesByUser(userID: number): Promise<IMatch[]> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            const matches: IMatch[] = [];

            this.connection.query(`SELECT * FROM matches WHERE user_1='${userID}' OR user_2='${userID}';`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                for (const res of result) {
                    matches.push({
                        id: res.id,
                        user1: (res.user_1 === null) ? null : res.user_1,
                        user2: (res.user_2 === null) ? null : res.user_2,
                        team1: (res.team_1 === null) ? null : res.team_1,
                        team2: (res.team_2 === null) ? null : res.team_2,
                        tournamentID: res.tournament_id,
                        row: res.tournament_row,
                        column: res.tournament_column,
                        score1: res.score1,
                        score2: res.score2,
                        finished: (res.finished === 1) ? true : false,
                    });
                }

                return resolve(matches);
            });
        });
    }

    public getMatchesByTeam(teamID: number): Promise<IMatch[]> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            const matches: IMatch[] = [];

            this.connection.query(`SELECT * FROM matches WHERE team_1='${teamID}' OR team_2='${teamID}';`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                for (const res of result) {
                    matches.push({
                        id: res.id,
                        user1: (res.user_1 === null) ? null : res.user_1,
                        user2: (res.user_2 === null) ? null : res.user_2,
                        team1: (res.team_1 === null) ? null : res.team_1,
                        team2: (res.team_2 === null) ? null : res.team_2,
                        tournamentID: res.tournament_id,
                        row: res.tournament_row,
                        column: res.tournament_column,
                        score1: res.score1,
                        score2: res.score2,
                        finished: (res.finished === 1) ? true : false,
                    });
                }

                return resolve(matches);
            });
        });
    }

    public getMatch(matchID: number): Promise<IMatch> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            this.connection.query(`SELECT * FROM matches WHERE id='${matchID}' LIMIT 1;`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                if (result.length !== 1) {
                    return reject();
                }

                return resolve({
                    id: result[0].id,
                    user1: (result[0].user_1 === null) ? null : result[0].user_1,
                    user2: (result[0].user_2 === null) ? null : result[0].user_2,
                    team1: (result[0].team_1 === null) ? null : result[0].team_1,
                    team2: (result[0].team_2 === null) ? null : result[0].team_2,
                    tournamentID: result[0].tournament_id,
                    row: result[0].tournament_row,
                    column: result[0].tournament_column,
                    score1: result[0].score1,
                    score2: result[0].score2,
                    finished: (result[0].finished === 1) ? true : false,
                });
            });
        });
    }

    public deleteMatch(matchID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`DELETE FROM matches WHERE id='${matchID}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }

    public updateScores(matchID: number, score1: number, score2: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            // UPDATE `users` SET `name` = 'aaaaaaa' WHERE `users`.`id` = 1;
            this.connection.query(`UPDATE matches SET score1='${score1}' , score2='${score2}' WHERE id='${matchID}';`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }

    public endMatch(matchID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`UPDATE matches SET finished=true WHERE id = '${matchID}';`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }
}

@singleton()
class MatchEventDatabase {
    private connection: mysql.Connection;

    constructor() {
        this.connection = null;
    }

    public setConnection(conn: mysql.Connection): void {
        this.connection = conn;
    }

    public addEvent(matchID: number, teamID: number, scorerID: number, assisterID: number): Promise<number> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            const uTeam: string = (teamID === null) ? "null" : `'${teamID}'`;
            const uAssister: string = (assisterID === null) ? "null" : `${assisterID}`;

            this.connection.query(
                `INSERT INTO match_events (match_id, team_id, scorer_id, assister_id) VALUES
                ('${matchID}',${uTeam},'${scorerID}',${uAssister});`, (err: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (err !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                if (result.affectedRows !== undefined && result.affectedRows > 0) {
                    return resolve(result.insertId);
                }

                return reject();
            });
        });
    }

    public getMatchEvents(matchID: number): Promise<IMatchEvent[]> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            const matches: IMatchEvent[] = [];

            this.connection.query(`SELECT * FROM match_events WHERE match_id='${matchID}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                for (const res of result) {
                    matches.push({
                        id: res.id,
                        match_id: res.match_id,
                        team_id: (res.team_id === null) ? null : res.team_id,
                        scorer_id: res.scorer_id,
                        assister_id: res.assister_id,
                    });
                }

                return resolve(matches);
            });
        });
    }

    public getMatchEventsByUser(userID: number): Promise<IMatchEvent[]> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            const matches: IMatchEvent[] = [];

            this.connection.query(`SELECT * FROM match_events WHERE scorer_id='${userID}' OR assister_id='${userID}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                for (const res of result) {
                    matches.push({
                        id: res.id,
                        match_id: res.match_id,
                        team_id: (res.team_id === null) ? null : res.team_id,
                        scorer_id: res.scorer_id,
                        assister_id: res.assister_id,
                    });
                }

                return resolve(matches);
            });
        });
    }

    public getMatchEventsByTeam(teamID: number): Promise<IMatchEvent[]> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            const matches: IMatchEvent[] = [];

            this.connection.query(`SELECT * FROM match_events WHERE team_id='${teamID}';`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result === null) {
                    return reject();
                }

                for (const res of result) {
                    matches.push({
                        id: res.id,
                        match_id: res.match_id,
                        team_id: (res.team_id === null) ? null : res.team_id,
                        scorer_id: res.scorer_id,
                        assister_id: res.assister_id,
                    });
                }

                return resolve(matches);
            });
        });
    }

    public getMatchEvent(matchEventID: number): Promise<IMatchEvent> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`SELECT * FROM match_events WHERE id='${matchEventID}' LIMIT 1;`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }
                if (result === null) {
                    return reject();
                }

                if (result.length !== 1) {
                    return reject();
                }

                return resolve({
                    id: result[0].id,
                    match_id: result[0].match_id,
                    team_id: (result[0].team_id === null) ? null : result[0].team_id,
                    scorer_id: result[0].scorer_id,
                    assister_id: result[0].assister_id,
                });
            });
        });
    }

    public deleteEvent(matchEventID: number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }

            this.connection.query(`DELETE FROM match_events WHERE id='${matchEventID}'`, (queryErr: mysql.MysqlError, result, field: mysql.FieldInfo[]) => {
                if (queryErr !== null) {
                    return reject();
                }

                if (result !== undefined && result.affectedRows === 1) {
                    return resolve();
                }

                return reject();
            });
        });
    }
}
