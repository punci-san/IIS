import { singleton } from "tsyringe";
import { Express } from "express-serve-static-core";
import { Request, Response } from "express";
import path from "path";

@singleton()
export class RouterHandler {
    constructor() {
        console.log("Creating new Router handler");
    }

    public addRoutes(app: Express): void {
        /*app.route("/")
            .get((req: Request, res: Response) => {
                console.log(path.join(__dirname, "../client/index.html"));
                res.sendFile(path.join(__dirname, "../client/index.html"));
            });*/
    }
}
