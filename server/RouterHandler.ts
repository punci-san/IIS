import { singleton, container } from "tsyringe";
import { Request, Response, json } from "express";
import { Express } from "express-serve-static-core";
import { Database } from "./database";
import { IUser } from "../interfaces/user";
import cors from "cors";
import { ITeam, ITeamRequest } from "../interfaces/team";

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

        this.addUserRoutes(app);
        this.addTeamRoutes(app);
        this.addTeamRequests(app);

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

        app.route("/teamuser/:id")
            .get((req: Request, res: Response) => {
                if (req.params.id === undefined) {
                    return res.status(404).send();
                }

                const num: number = Number(req.params.id);

                this.database.getTeamUsers(num)
                .then((result: IUser[]) => {
                    return res.json(result);
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
            this.isAuthenticated(req)
            .then((userObj: IUser) => {
                if (req.params.id === undefined) {
                    return res.status(404).send();
                }

                const userID: number = Number(req .params.id);

                if (isNaN(userID)) {
                    return res.status(404).send();
                }

                if (userObj.id !== userID && userObj.admin === false) {
                    return res.status(401).send();
                }

                this.database.deleteUser(userID)
                .then(() => {
                    return res.send();
                })
                .catch(() => {
                    return res.status(500).send();
                });
            })
            .catch(() => {
                return res.status(401).send();
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
        })
        .delete((req: Request, res: Response) => {
            if (req.params.id === undefined) {
                return res.status(401).send();
            }

            const id: number = Number(req.params.id);

            this.database.deleteTeam(id)
            .then(() => {
                return res.send();
            })
            .catch(() => {
                return res.status(401).send();
            });
        });

        app.route("/team-kick")
        .post((req: Request, res: Response) => {
            this.isAuthenticated(req)
            .then((usrObj: IUser) => {
                if (req.body.team_id === undefined || req.body.user_id === undefined) {
                    return res.status(404).send();
                }

                const teamID: number = Number(req.body.team_id);
                const userID: number = Number(req.body.user_id);

                if (isNaN(teamID) || isNaN(userID)) {
                    return res.status(404).send();
                }

                this.database.getTeam(teamID)
                .then((team: ITeam) => {
                    // Only team admin can kick
                    if (team.creator_id !== usrObj.id) {
                        return res.status(401).send();
                    }

                    // Kick user from team
                    this.database.kickUser(userID, teamID)
                    .then(() => {
                        return res.send();
                    })
                    .catch(() => {
                        return res.status(500).send();
                    });
                })
                .catch(() => {
                    return res.status(500).send();
                });
            })
            .catch(() => {
                return res.status(401).send();
            });
        });

        app.route("/team-admin")
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((user: IUser) => {
                    if (req.body.user_id === undefined || req.body.team_id === undefined) {
                        return res.status(404).send();
                    }

                    const userID: number = Number(req.body.user_id);
                    const teamID: number = Number(req.body.team_id);

                    if (isNaN(userID) || isNaN(teamID)) {
                        return res.status(404).send();
                    }

                    this.database.changeTeamAdmin(teamID, userID)
                    .then((team: ITeam) => {
                        return res.json(team);
                    })
                    .catch(() => {
                        return res.status(500).send();
                    });
                })
                .catch(() => {
                    return res.status(401).send();
                });
            });
    }

    private addTeamRequests(app: Express): void {
        app.route("/teamrequest/:id")
        .get((req: Request, res: Response) => {
            this.isAuthenticated(req)
            .then((user: IUser) => {
                const teamRequestID: number = Number(req.params.id);

                if (isNaN(teamRequestID)) {
                    return res.status(404).send();
                }

                this.database.getTeamRequests(teamRequestID)
                .then((results: ITeamRequest[]) => {
                    return res.json(results);
                })
                .catch(() => {
                    return res.status(404).send();
                });
            })
            .catch(() => {
                return res.status(401).send();
            });
        });

        app.route("/teamrequest")
        .get((req: Request, res: Response) => {
            this.isAuthenticated(req)
            .then((user: IUser) => {
                this.database.getTeamRequests(null)
                .then((results: ITeamRequest[]) => {
                    return res.json(results);
                })
                .catch(() => {
                    return res.status(404).send();
                });
            })
            .catch(() => {
                return res.status(401).send();
            });
        })
        .post((req: Request, res: Response) => {

            if (req.body.user_id === undefined || req.body.team_id === undefined) {
                return res.status(401).send();
            }

            const userID: number = Number(req.body.user_id);
            const teamID: number = Number(req.body.team_id);

            if (isNaN(userID) || isNaN(teamID)) {
                return res.status(500).send();
            }

            this.isAuthenticated(req)
            .then((user: IUser) => {
                this.database.addTeamRequest(teamID, userID)
                .then(() => {
                    return res.send();
                })
                .catch(() => {
                    return res.status(500).send();
                });
            })
            .catch(() => {
                return res.status(401).send();
            });
        });

        app.route("/teamrequest-accept")
        .post((req: Request, res: Response) => {

            if (req.body.id === undefined || req.body.team_id === undefined) {
                return res.status(404).send();
            }

            const teamRequestID: number = Number(req.body.id);
            const teamID: number = Number(req.body.team_id);

            if (isNaN(teamRequestID) || isNaN(teamID)) {
                return res.status(404).send();
            }

            this.isAuthenticated(req)
            .then((user: IUser) => {
                this.database.getTeam(teamID)
                .then((team: ITeam) => {
                    if (user.id !== team.creator_id) {
                        return res.status(401).send();
                    }

                    this.database.acceptTeamRequest(teamRequestID)
                    .then(() => {
                        return res.send();
                    })
                    .catch(() => {
                        return res.status(500).send();
                    });
                })
                .catch(() => {
                    return res.status(404).send();
                });
            })
            .catch(() => {
                return res.status(401).send();
            });
        });

        app.route("/teamrequest-deny")
        .post((req: Request, res: Response) => {

            if (req.body.id === undefined || req.body.team_id === undefined) {
                return res.status(404).send();
            }

            const teamRequestID: number = Number(req.body.id);
            const teamID: number = Number(req.body.team_id);

            if (isNaN(teamRequestID) || isNaN(teamID)) {
                return res.status(404).send();
            }

            this.isAuthenticated(req)
            .then((user: IUser) => {
                this.database.getTeam(teamID)
                .then((team: ITeam) => {
                    if (user.id !== team.creator_id) {
                        return res.status(401).send();
                    }

                    this.database.deleteTeamRequest(teamRequestID)
                    .then(() => {
                        return res.send();
                    })
                    .catch(() => {
                        return res.status(500).send();
                    });
                })
                .catch(() => {
                    return res.status(404).send();
                });
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
