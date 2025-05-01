import { installCommand } from "./installCommand.js";
import {checkCommand} from "./checkCommand.js";
import {buildCommand} from "./buildCommand.js";
import {cleanInstallCommand} from "./cleanInstallCommand.js";
import {addCommand} from "./addCommand.js";
import {removeCommand} from "./removeCommand.js";
import {resolveCommand} from "./resolveCommand.js";
import {allowedVersions} from "./allowedVersionsCommand.js";
import {ConsoleCommand} from "./types.js";
import {DependencyService} from "../../application/DependencyService.js";

export const commands = (service: DependencyService): ConsoleCommand[] => {
    return [
        installCommand,
        checkCommand,
        buildCommand,
        cleanInstallCommand,
        addCommand,
        removeCommand,
        resolveCommand,
        allowedVersions,
    ].map(command => command(service));
}