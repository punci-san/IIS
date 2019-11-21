import { singleton, container } from "tsyringe";
import mysql from "mysql";
import { IUser } from "../interfaces/user";
import { ITeam, ITeamRequest } from "../interfaces/team";
import { rejects } from "assert";

const dbServer = "localhost";
const user = "xskuta04";
const pass = "edurka6m";
const database = "xskuta04";

@singleton()
export class Database {
    private connection: mysql.Connection;
    private userDatabase: UserDatabase;
    private teamDatabase: TeamDatabase;
    private teamRequestsDatabase: TeamRequestsDatabase;

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
        this.teamRequestsDatabase = container.resolve(TeamRequestsDatabase);

        this.connection.connect((err: mysql.MysqlError) => {
            if (err === null) {
                this.userDatabase.setConnection(this.connection);
                this.teamDatabase.setConnection(this.connection);
                this.teamRequestsDatabase.setConnection(this.connection);
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

    /**
     * TEAMS
     */

    public addTeam(name: string, userObject: IUser): Promise<any> {
        return new Promise((resolve, reject) => {
            this.teamDatabase.addTeam(name, userObject.id)
            .then((id: number) => {
                // Add user to given team
                this.updateUser(userObject.id, null, null, id, null, null)
                .then(() => {
                    this.getUser(userObject.id)
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
                    admin: result[0].admin !== null && result[0].admin === 1,
                    description: result[0].description,
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
                        admin: res.admin,
                        team: res.team_id,
                        description: res.description,
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
                        admin: result[0].admin,
                        team: result[0].team_id,
                        description: result[0].description,
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
                        admin: res.admin,
                        team: res.team_id,
                        description: res.description,
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
                            admin: result[0].admin !== null && result[0].admin === 1,
                            name: result[0].name,
                            team: result[0].team_id,
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
                        creator_id : result[0].creator_id ,
                    } as ITeam);
                }

                return reject();
            });
        });
    }

    public updateTeam(teamID: number, name: string, creatorID: number): Promise<ITeam> {
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

    public addTeam(name: string, creatorId: number): Promise<number> {
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
                this.connection.query(`INSERT INTO teams (name, creator_id ) VALUES ('${name}', '${creatorId}')`,
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
