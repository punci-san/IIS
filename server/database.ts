import { singleton, container } from "tsyringe";
import mysql from "mysql";
import { IUser } from "../interfaces/user";
import { ITeam } from "../interfaces/team";

const dbServer = "localhost";
const user = "xskuta04";
const pass = "edurka6m";
const database = "xskuta04";

@singleton()
export class Database {
    private connection: mysql.Connection;
    private userDatabase: UserDatabase;
    private teamDatabase: TeamDatabase;

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

        this.connection.connect((err: mysql.MysqlError) => {
            if (err === null) {
                this.userDatabase.setConnection(this.connection);
                this.teamDatabase.setConnection(this.connection);
            } else {
                console.log(err);
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
        return this.userDatabase.deleteUser(id);
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
                        console.log("User getting failed.");
                        return reject();
                    });
                })
                .catch(() => {
                    console.log("User updating failed.");
                    return reject();
                });
            })
            .catch(() => {
                console.log("Team adding failed.");
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
                        description: result[0].description,
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
                    console.log(queryErr);
                    return reject();
                }
                if (result === null) {
                    console.log(result);
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

            if (username !== null && username !== undefined) {
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

            console.log(`UPDATE users SET ${uUsername} ${uPassword} ${uTeam} ${uDescription} ${uAdmin} WHERE id = '${id}';`);
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

                console.log(result);
                console.log(field);
                resolve(result);
            });
        });
    }

    public userExist(username: string): Promise<IUser> {
        return new Promise((resolve, reject) => {
            if (this.connection === null) {
                return reject();
            }
            // INSERT INTO `users` (`id`, `name`, `pass`, `admin`, `team`) VALUES ('1', 'xpodlu01', 'jebojo9mon', '0', NULL);
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
