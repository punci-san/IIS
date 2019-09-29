import "reflect-metadata";
import { container } from "tsyringe";
import { IIS } from "./iis";

const a = container.resolve(IIS);
