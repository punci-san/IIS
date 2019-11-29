import { mkdirSync, existsSync, writeFileSync } from "fs";
import path from "path";
import { singleton } from "tsyringe";
import { extensions } from "mime-types";
import { defaultTeamIcon } from "../settings/variables";

@singleton()
export class UploadHandler {
    private uploadPath: string;
    private counter: number;

    constructor() {
        this.counter = 0;
        this.uploadPath = path.join(__dirname, "..", "..", "uploads");
        this.createUploadFolder();
    }

    public uploadFile(file): string {
        if (file === null || file === undefined) {
            return null;
        }

        const {
            fieldname,
            originalname,
            encoding,
            mimetype,
            buffer,
          } = file;

        const exts: string[] = extensions[mimetype];

        if (exts.length === 0) {
            return null;
        }

        const fileName: string = `${this.counter++}.${exts[0]}`;
        const filePath: string = path.join(this.uploadPath, fileName);

        writeFileSync(filePath, buffer);

        if (existsSync(filePath)) {
            return fileName;
        }
        return null;
    }

    public getFilePath(fileName): string {
        const filePath: string = path.join(this.uploadPath, fileName);

        if (existsSync(filePath)) {
            return filePath;
        }

        return path.join(this.uploadPath, defaultTeamIcon);
    }

    private createUploadFolder(): void {
        if (!existsSync(this.uploadPath)) {
            mkdirSync(this.uploadPath, {recursive: true});
        }
    }
}
