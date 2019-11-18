import { singleton, container } from "tsyringe";
import { Request, Response, json } from "express";
import { Express } from "express-serve-static-core";
import { Database } from "./database";
import { IUser } from "../interfaces/user";
import cors from "cors";
import { ITeam } from "../interfaces/team";

const varcharLen = 255;

@singleton()
export class RouterHandler {
    private database: Database;

    constructor() {
        this.database = container.resolve(Database);
    }

    public addRoutes(app: Express): void {
        app.use(cors());
        app.use(json());

        // parse application/json
        this.addUserRoutes(app);
        this.addTeamRoutes(app);

        // Path not found
        app.route("*")
            .all((req: Request, res: Response) => {
                return res.status(404).send();
            });
}

    private addUserRoutes(app: Express): void {
        app.route("/login")
        .post((req: Request, res: Response) => {
            const {user, pass} = req.body;

            if (user === undefined || pass === undefined) {
                return res.status(401).send();
            }

            this.database.authenticate(user, pass)
            .then((result) => {
                return res.send(result);
            })
            .catch(() => {
                return res.status(401).send();
            });
        });

        app.route("/register")
            .post((req: Request, res: Response) => {
                const {user, pass, admin} = req.body;

                if (user === undefined || pass === undefined) {
                    return res.status(401).send();
                }

                if (user.length >= varcharLen || pass.length >= varcharLen) {
                    return res.status(401).send();
                }

                this.database.register(user, pass, admin)
                .then((result) => {
                    return res.send(result);
                })
                .catch(() => {
                    return res.status(401).send();
                });
            });

        app.route("/user")
        .get((req: Request, res: Response) => {
            this.database.getUsers()
            .then((result: IUser[]) => {
                return res.json(result);
            })
            .catch(() => {
                return res.json();
            });
        });

        app.route("/user/:id")
        .get((req: Request, res: Response) => {
            if (req.params.id === undefined) {
                return res.status(404).send();
            }

            const userID: number = Number(req.params.id);

            this.database.getUser(userID)
            .then((result: IUser) => {
                return res.json(result);
            })
            .catch(() => {
                return res.status(401).send();
            });
        })
        .put((req: Request, res: Response) => {
            this.isAuthenticated(req)
            .then((usr: IUser) => {
                if (req.params.id === undefined) {
                    return res.status(401).send();
                }

                const id: number = Number(req.params.id);

                if (id !== usr.id && usr.admin === false) {
                    return res.status(401).send();
                }

                const {user, pass, team, admin, description} = req.body;

                this.database.updateUser(id, user, pass, team, admin, description)
                .then((usrRes: IUser) => {
                    return res.json(usrRes);
                })
                .catch(() => {
                    return res.status(401).send();
                });
            })
            .catch(() => {
                return res.status(401).send();
            });
        })
        .delete((req: Request, res: Response) => {
            if (req.params.id === undefined) {
                return res.status(404).send();
            }

            const userID: number = Number(req .params.id);

            this.database.deleteUser(userID)
            .then((result) => {
                return res.send(result);
            })
            .catch(() => {
                return res.json(JSON.stringify([]));
            });
        });
    }

    private addTeamRoutes(app: Express): void {
        app.route("/team")
        .get((req: Request, res: Response) => {
            this.database.getTeams()
            .then((result) => {
                return res.send(result);
            })
            .catch(() => {
                return res.json(JSON.stringify([]));
            });
        })
        .post(
            (req: Request, res: Response) => {
                // Check if user is authenticated
                this.isAuthenticated(req)
                .then((user: IUser) => {
                    // Check if team was given
                    if (req.body.team === undefined) {
                        return res.status(401).send();
                    }

                    // When user already has a team skip
                    if (user.team !== null) {
                        return res.status(401).send();
                    }

                    // Create team and add user to that team
                    this.database.addTeam(req.body.team, user)
                    .then((usr: IUser) => {
                        return res.json(usr);
                    })
                    .catch(() => {
                        return res.status(401).send();
                    });
                })
                .catch(() => {
                    return res.status(401).send();
                });
            });

        app.route("/team/:id")
        .get((req: Request, res: Response) => {
            if (req.params.id === undefined) {
                return res.status(401).send();
            }

            const id: number = Number(req.params.id);

            this.database.getTeam(id)
            .then((result: ITeam) => {
                return res.send(result);
            })
            .catch(() => {
                return res.status(401).send();
            });
        });
    }

    private isAuthenticated(req: Request): Promise<IUser> {
        return new Promise((resolve, reject) => {
            const user: string = req.get("Authorization");

            if (user === undefined) {
                return reject();
            }

            this.database.userExist(user)
            .then((res: IUser) => {
                return resolve(res);
            })
            .catch(() => {
                return reject();
            });
        });
    }
}
