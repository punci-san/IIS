import express, { Router } from "express";
import { Express } from "express-serve-static-core";
import path from "path";
import { container, singleton } from "tsyringe";
import { RouterHandler } from "./RouterHandler";

const port = 5000;
const dbServer = "mongodb://localhost:27017/WebDemander";

@singleton()
export class IIS {
    private app: Express;
    private routeHandler: RouterHandler;

    constructor() {
        this.app = express();
        this.routeHandler = container.resolve(RouterHandler);
        this.routeHandler.addRoutes(this.app);
        this.listen();
    }

    private listen(): void {
        console.log(path.join(path.join(__dirname + "./../client/")));
        this.app.use("/", express.static(path.join(__dirname + "./../client/")));
        this.app.use("/", Router);
        this.app.listen(port, (err) => {
            if (err) {
                console.log("Error while creating server.");
                return;
            }
            console.log("Server is listening on", port);
        });
    }
}