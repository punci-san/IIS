import { singleton, container } from "tsyringe";
import express, { Request, Response, json } from "express";
import { Express } from "express-serve-static-core";
import { Database } from "./database";
import { IUser } from "../interfaces/user";
import cors from "cors";
import path from "path";
import { ITeam, ITeamRequest } from "../interfaces/team";
import { ITournament, ITeamType } from "../interfaces/tournament";
import { teamType, numberOfPlayers } from "../settings/tournament_config";
import { ITournamentRegistrations } from "../interfaces/tournament-registrations";
import { IMatch } from "../interfaces/match";
import { IMatchEvent } from "../interfaces/match_event";
import { defaultTeamIcon } from "../settings/variables";
import bodyParser = require("body-parser");
import fileParser from "express-multipart-file-parser";
import { UploadHandler } from "./upload_handler";
import { IUserStatistics } from "../interfaces/statistics";

const varcharLen = 255;

@singleton()
export class RouterHandler {
    private database: Database;
    private uploadHandler: UploadHandler;

    constructor() {
        this.database = container.resolve(Database);
        this.uploadHandler = container.resolve(UploadHandler);
    }

    public addRoutes(app: Express): void {
        app.use(cors());
        app.use(bodyParser.urlencoded({extended: true}));
        app.use(json());

        app.use("/", express.static(path.join(__dirname + "./../../client/")));
        app.use("/me", express.static(path.join(__dirname + "./../../client/")));
        app.use("/show-user", express.static(path.join(__dirname + "./../../client/")));
        app.use("/user-log_reg", express.static(path.join(__dirname + "./../../client/")));
        app.use("/add-team", express.static(path.join(__dirname + "./../../client/")));
        app.use("/show-team", express.static(path.join(__dirname + "./../../client/")));
        app.use("/add-tournament", express.static(path.join(__dirname + "./../../client/")));
        app.use("/show-tournament", express.static(path.join(__dirname + "./../../client/")));

        this.addUserRoutes(app);
        this.addTeamRoutes(app);
        this.addStatisticRoutes(app);
        this.addTeamRequests(app);
        this.addTournamentRoutes(app);
        this.addTournamentRegistrationRoutes(app);
        this.addMatchRoutes(app);
        this.addMatchEventRoutes(app);

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

        app.route("/user-ban")
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    if (usr.admin === false) {
                        return res.status(401).send();
                    }

                    const userID: number = Number(req.body.user_id);

                    if (isNaN(userID)) {
                        return res.status(500).send();
                    }

                    if (userID === usr.id) {
                        return res.status(500).send();
                    }

                    this.database.banUser(userID)
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

        app.route("/user-unban")
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    if (usr.admin === false) {
                        return res.status(401).send();
                    }

                    const userID: number = Number(req.body.user_id);

                    if (isNaN(userID)) {
                        return res.status(500).send();
                    }

                    if (userID === usr.id) {
                        return res.status(500).send();
                    }

                    this.database.unBanUser(userID)
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
        .post(fileParser, (req: Request, res: Response) => {
                // Check if user is authenticated
                this.isAuthenticated(req)
                .then((user: IUser) => {
                    // Check if team was given
                    if (req.body.team_name === undefined || req.body.team_name === null) {
                        return res.status(500).send();
                    }

                    // Check if shortcut was given
                    if (req.body.team_shortcut === undefined || req.body.team_shortcut === null) {
                        return res.status(500).send();
                    }

                    const fileName: string = this.uploadHandler.uploadFile(req.files[0]);

                    // When user already has a team skip
                    if (user.team !== null) {
                        return res.status(500).send();
                    }

                    // Create team and add user to that team
                    this.database.addTeam(req.body.team_name, req.body.team_shortcut, user,
                        (fileName === null) ? defaultTeamIcon : fileName)
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

        app.route("/team-logo/:name")
            .get((req: Request, res: Response) => {
                const fileName: string = req.params.name;

                if (fileName === null || fileName === undefined) {
                    return res.sendFile(this.uploadHandler.getFilePath(defaultTeamIcon));
                }

                return res.sendFile(this.uploadHandler.getFilePath(fileName));
            });
    }

    private addStatisticRoutes(app: Express): void {
        app.route("/user-statistics/:id")
            .get((req: Request, res: Response) => {
                const userID: number = (req.params.id === null) ? NaN : Number(req.params.id);

                if (isNaN(userID)) {
                    return res.status(404).send();
                }

                this.database.getUserStatistics(userID)
                .then((stat: IUserStatistics) => {
                    return res.json(stat);
                })
                .catch(() => {
                    return res.status(404).send();
                });
            });

        app.route("/team-statistics/:id")
            .get((req: Request, res: Response) => {
                const teamID: number = (req.params.id === null) ? NaN : Number(req.params.id);

                if (isNaN(teamID)) {
                    return res.status(404).send();
                }

                this.database.getTeamStatistics(teamID)
                .then((stat: IUserStatistics) => {
                    return res.json(stat);
                })
                .catch(() => {
                    return res.status(404).send();
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

    private addTournamentRoutes(app: Express): void {
        app.route("/tournament")
            .get((req: Request, res: Response) => {
                this.database.getTournaments()
                .then((tournaments: ITournament[]) => {
                    return res.json(tournaments);
                })
                .catch(() => {
                    return res.json([]);
                });
            })
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    if (req.body.name === undefined ||
                        req.body.number_of_players === undefined ||
                        req.body.tournament_type === undefined ||
                        req.body.register_fee === undefined ||
                        req.body.description === undefined ||
                        req.body.tournament_start === undefined ||
                        req.body.sponsors === undefined) {
                            return res.status(500).send();
                    }

                    const name = req.body.name;
                    const nop: number = Number(req.body.number_of_players);
                    const tourType: number = Number(req.body.tournament_type);
                    const fee: number = Number(req.body.register_fee);
                    const desc = req.body.description;
                    const sponsors = req.body.sponsors;
                    const tournamentStart: Date = new Date(req.body.tournament_start);

                    if (
                        name === "" ||
                        isNaN(nop) ||
                        isNaN(tourType) ||
                        isNaN(fee) ||
                        numberOfPlayers.includes(nop) === false ||
                        tourType < 0 || tourType > teamType.length ||
                        tournamentStart.getDate() < new Date().getDate()
                        ) {
                            return res.status(500).send();
                    }

                    this.database.addTournament(
                        name,
                        new Date(),
                        nop,
                        tourType,
                        fee,
                        desc,
                        usr.id,
                        tournamentStart,
                        sponsors,
                    )
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

        app.route("/tournament-finalize")
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    const tournamentID: number = Number(req.body.tournament_id);

                    if (isNaN(tournamentID)) {
                        console.log("NaN");
                        return res.status(500).send();
                    }

                    this.database.getTournament(tournamentID)
                    .then((t: ITournament) => {
                        if (t.creator_id !== usr.id) {
                            return res.status(401).send();
                        }

                        console.log(t);

                        if (t.created !== null) {
                            console.log("Not created.");
                            return res.status(500).send();
                        }

                        this.database.countAcceptedRegs(tournamentID, t.team_type !== ITeamType.PvP)
                        .then((count: number) => {

                            if (count !== t.number_of_players && t.referee_id === null) {
                                console.log("Not the same count or referee not selected.");
                                return res.status(500).send();
                            }

                            this.database.updateTournamentCreation(tournamentID, false)
                            .then(() => {
                                return res.send();
                            })
                            .catch(() => {
                                console.log("Tournament update failed");
                                return res.status(500).send();
                            });
                        })
                        .catch(() => {
                            console.log("Count failed.");
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

        app.route("/tournament-start")
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    const tournamentID: number = Number(req.body.tournament_id);

                    if (isNaN(tournamentID)) {
                        return res.status(500).send();
                    }

                    this.database.getTournament(tournamentID)
                    .then((t: ITournament) => {
                        if (t.creator_id !== usr.id) {
                            return res.status(401).send();
                        }

                        if (t.created !== false) {
                            return res.status(500).send();
                        }

                        this.database.countAcceptedRegs(tournamentID, t.team_type !== ITeamType.PvP)
                        .then((count: number) => {

                            if (count !== t.number_of_players && t.referee_id === null) {
                                return res.status(500).send();
                            }

                            this.database.updateTournamentCreation(tournamentID, true)
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
                        return res.status(404).send();
                    });
                })
                .catch(() => {
                    return res.status(401).send();
                });
            });

        app.route("/tournament/:id")
        .get((req: Request, res: Response) => {
            if (req.params.id === undefined) {
                return res.status(404).send();
            }

            const id: number = Number(req.params.id);

            if (isNaN(id)) {
                return res.status(404).send();
            }

            this.database.getTournament(id)
            .then((tournament: ITournament) => {
                return res.json(tournament);
            })
            .catch(() => {
                return res.status(404).send();
            });
        })
        .delete((req: Request, res: Response) => {
            this.isAuthenticated(req)
            .then((usr: IUser) => {

                const tournamentID: number = Number(req.params.id);

                if (isNaN(tournamentID)) {
                    return res.status(404).send();
                }

                this.database.getTournament(tournamentID)
                .then((t: ITournament) => {
                    if (t.creator_id !== usr.id) {
                        return res.status(401).send();
                    }

                    this.database.deleteTournament(tournamentID).
                    then(() => {
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
                return res.status(500).send();
            });
        });
    }

    private addTournamentRegistrationRoutes(app: Express): void {
        app.route("/tournament-registration")
            .post((req: Request, res: Response) => {
                // User needs to be registered
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    const tournamentID: number = Number(req.body.tournament_id);
                    const userID: number = isNaN(Number(req.body.user_id)) ? null : Number(req.body.user_id);
                    const teamID: number = isNaN(Number(req.body.team_id)) ? null : Number(req.body.team_id);
                    const referee: boolean = (req.body.referee === undefined) ? null : req.body.referee;

                    if (isNaN(tournamentID)) {
                        return res.status(500).send();
                    }

                    if (userID === null && teamID === null) {
                        return res.status(500).send();
                    }
                    this.database.getTournament(tournamentID)
                    .then((t: ITournament) => {
                        if (t.created !== null) {
                            return res.status(500).send();
                        }

                        this.database.addTournamentReg(tournamentID, userID, teamID, referee)
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

        app.route("/tournament-registration/:id")
            .get((req: Request, res: Response) => {
                if (req.params.id === undefined) {
                    return res.status(404).send();
                }

                const tournamentID: number = Number(req.params.id);

                if (isNaN(tournamentID)) {
                    return res.status(404).send();
                }

                this.database.getTournamentRegistrations(tournamentID)
                .then((trs: ITournamentRegistrations[]) => {
                    return res.json(trs);
                })
                .catch(() => {
                    return res.status(404).send();
                });
            });

        app.route("/tournament-registration-referee-accept")
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    const tournamentID: number = Number(req.body.tournament_id);
                    const userID: number = Number(req.body.user_id);

                    if (isNaN(tournamentID) || isNaN(userID)) {
                        return res.status(404).send();
                    }

                    this.database.getTournament(tournamentID)
                    .then((t: ITournament) => {
                        if (t.creator_id !== usr.id) {
                            return res.status(401).send();
                        }

                        if (t.created !== null) {
                            return res.status(500).send();
                        }

                        this.database.acceptTournamentRegReferee(tournamentID, userID)
                        .then(() => {
                            return res.send();
                        })
                        .catch(() => {
                            return res.status(404).send();
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

        app.route("/tournament-registration-referee-deny")
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    const tournamentID: number = Number(req.body.tournament_id);
                    const userID: number = Number(req.body.user_id);

                    if (isNaN(tournamentID) || isNaN(userID)) {
                        return res.status(404).send();
                    }

                    this.database.getTournament(tournamentID)
                    .then((t: ITournament) => {
                        if (t.creator_id !== usr.id) {
                            return res.status(401).send();
                        }

                        if (t.created !== null) {
                            return res.status(500).send();
                        }

                        this.database.denyTournamentRegReferee(tournamentID, userID)
                        .then(() => {
                            return res.send();
                        })
                        .catch(() => {
                            return res.status(404).send();
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

        app.route("/tournament-registration-referee-clear")
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    const tournamentID: number = Number(req.body.tournament_id);

                    if (isNaN(tournamentID)) {
                        return res.status(404).send();
                    }

                    this.database.getTournament(tournamentID)
                    .then((t: ITournament) => {
                        if (t.creator_id !== usr.id) {
                            return res.status(401).send();
                        }

                        if (t.created !== null) {
                            return res.status(500).send();
                        }

                        const refereeID: number = t.referee_id;

                        this.database.clearTournamentReg(tournamentID, refereeID, null)
                        .then(() => {
                            this.database.clearTournamentReferee(tournamentID)
                            .then(() => {
                                return res.send();
                            })
                            .catch(() => {
                                return res.status(404).send();
                            });
                        })
                        .catch(() => {
                            return res.status(404).send();
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

        app.route("/tournament-registration-accept")
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    const tournamentID: number = Number(req.body.tournament_id);
                    const userID: number = isNaN(Number(req.body.user_id)) ? null : Number(req.body.user_id);
                    const teamID: number = isNaN(Number(req.body.team_id)) ? null : Number(req.body.team_id);

                    if (isNaN(tournamentID) || (userID === null && teamID === null)) {
                        return res.status(404).send();
                    }

                    this.database.getTournament(tournamentID)
                    .then((t: ITournament) => {
                        if (t.creator_id !== usr.id) {
                            return res.status(401).send();
                        }

                        if (t.created !== null) {
                            return res.status(401).send();
                        }

                        const countTeams: boolean = (teamID === null && userID !== null) ? false : true;

                        this.database.countAcceptedRegs(tournamentID, countTeams)
                        .then((count: number) => {

                            if (count > t.number_of_players) {
                                return res.status(500).send();
                            }

                            this.database.acceptTournamentReg(tournamentID, userID, teamID)
                            .then(() => {
                                return res.send();
                            })
                            .catch(() => {
                                return res.status(404).send();
                            });
                        })
                        .catch(() => {
                            return res.status(404).send();
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

        app.route("/tournament-registration-deny")
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    const tournamentID: number = Number(req.body.tournament_id);
                    const userID: number = isNaN(Number(req.body.user_id)) ? null : Number(req.body.user_id);
                    const teamID: number = isNaN(Number(req.body.team_id)) ? null : Number(req.body.team_id);

                    if (isNaN(tournamentID) || (userID === null && teamID === null)) {
                        return res.status(404).send();
                    }

                    this.database.getTournament(tournamentID)
                    .then((t: ITournament) => {
                        if (t.creator_id !== usr.id) {
                            return res.status(401).send();
                        }

                        if (t.created !== null) {
                            return res.status(401).send();
                        }

                        this.database.denyTournamentReg(tournamentID, userID, teamID)
                        .then(() => {
                            return res.send();
                        })
                        .catch(() => {
                            return res.status(404).send();
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

    private addMatchRoutes(app: Express): void {
        app.route("/match")
            .post((req: Request, res: Response) => {
                const tournamentID: number = Number(req.body.tournament_id);
                const user1: number = (req.body.user_1 === null) ? null : Number(req.body.user_1);
                const user2: number = (req.body.user_2 === null) ? null : Number(req.body.user_2);
                const team1: number = (req.body.team_1 === null) ? null : Number(req.body.team_1);
                const team2: number = (req.body.team_2 === null) ? null : Number(req.body.team_2);
                const row: number = Number(req.body.row);
                const column: number = Number(req.body.column);

                if (isNaN(tournamentID) || isNaN(row) || isNaN(column)) {
                    return res.status(500).send();
                }

                if ((user1 === null && user2 === null) && isNaN(team1) && isNaN(team2)) {
                    return res.status(500).send();
                }

                if ((team1 === null && team2 === null) && isNaN(user1) && isNaN(user2)) {
                    return res.status(500).send();
                }

                // Check if tournament exist
                this.database.getTournament(tournamentID)
                .then((t: ITournament) => {
                    // User needs to be registered
                    this.isAuthenticated(req)
                    .then((usr: IUser) => {
                        // Only creator can add match
                        if (t.creator_id !== usr.id) {
                            return res.status(401).send();
                        }

                        // Or system can add match
                        this.database.addMatch(tournamentID, user1, user2, team1, team2, row, column)
                        .then(() => {
                            return res.send();
                        })
                        .catch(() => {
                            return res.status(500).send();
                        });
                    })
                    .catch(() => {
                        if (this.isSystem(req) === false) {
                            return res.status(401).send();
                        }
                        // Or system can add match
                        this.database.addMatch(tournamentID, user1, user2, team1, team2, row, column)
                        .then(() => {
                            return res.send();
                        })
                        .catch(() => {
                            return res.status(500).send();
                        });
                    });
                })
                .catch(() => {
                    return res.status(404).send();
                });
            });

        app.route("/match-end")
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    const tournamentID: number = (req.body.tournament_id === null) ? null : Number(req.body.tournament_id);
                    const matchID: number = (req.body.match_id === null) ? null : Number(req.body.match_id);

                    if (tournamentID === null || matchID === null) {
                        return res.status(404).send();
                    }

                    this.database.getTournament(tournamentID)
                    .then((t: ITournament) => {
                        if (t.referee_id !== usr.id) {
                            console.log("Not referee");
                            return res.status(401).send();
                        }

                        this.database.endMatch(tournamentID, matchID)
                        .then(() => {
                            return res.send();
                        })
                        .catch(() => {
                            return res.status(404).send();
                        });
                    })
                    .catch(() => {
                        return res.status(401).send();
                    });
                })
                .catch(() => {
                    return res.status(401).send();
                });
            });

        app.route("/match/:id")
            .get((req: Request, res: Response) => {
                const tournamentID: number = Number(req.params.id);

                // Check if tournament exist
                this.database.getTournament(tournamentID)
                .then((t: ITournament) => {
                    // Get all matches of given tournament
                    this.database.getMatches(tournamentID)
                    .then((ms: IMatch[]) => {
                        return res.json(ms);
                    })
                    .catch(() => {
                        return res.status(404).send();
                    });
                })
                .catch(() => {
                    return res.status(404).send();
                });
            })
            .delete((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    const matchID: number = Number(req.params.id);

                    if (isNaN(matchID)) {
                        return res.status(404).send();
                    }

                    this.database.deleteMatch(matchID)
                    .then(() => {
                        return res.send();
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

    private addMatchEventRoutes(app: Express): void {
        app.route("/match-event")
            .post((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {

                    const tournamentID: number = Number(req.body.tournament_id);
                    const matchID: number = Number(req.body.match_id);
                    const teamID: number = (req.body.team_id === null) ? null : Number(req.body.team_id);
                    const scorerID: number = Number(req.body.scorer_id);
                    const assisterID: number = (req.body.assister_id === null) ? null : Number(req.body.assister_id);

                    if (isNaN(tournamentID) || isNaN(matchID) || isNaN(scorerID)) {
                        return res.status(500).send();
                    }

                    this.database.getTournament(tournamentID)
                    .then((t: ITournament) => {
                        // User is not referee, exit
                        if (t.referee_id !== usr.id) {
                            return res.status(401).send();
                        }

                        this.database.addMatchEvent(matchID, teamID, scorerID, assisterID)
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

        app.route("/match-event/:id")
            .get((req: Request, res: Response) => {
                const matchEventID: number = Number(req.params.id);

                if (isNaN(matchEventID)) {
                    return res.status(404).send();
                }

                this.database.getMatchEvents(matchEventID)
                .then((matchEvents: IMatchEvent[]) => {
                    return res.json(matchEvents);
                })
                .catch(() => {
                    return res.status(404).send();
                });
            })
            .delete((req: Request, res: Response) => {
                this.isAuthenticated(req)
                .then((usr: IUser) => {
                    const matchEventID: number = Number(req.params.id);

                    if (isNaN(matchEventID)) {
                        return res.status(404).send();
                    }

                    this.database.deleteMatchEvent(matchEventID)
                    .then(() => {
                        return res.send();
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

    private isSystem(req: Request): boolean {
        return req.get("System") !== undefined;
    }
}
