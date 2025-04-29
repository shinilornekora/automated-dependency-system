import { installCommand } from "./installCommand";
import {checkCommand} from "./checkCommand";
import {buildCommand} from "./buildCommand";
import {cleanInstallCommand} from "./cleanInstallCommand";
import {addCommand} from "./addCommand";
import {removeCommand} from "./removeCommand";
import {resolveCommand} from "./resolveCommand";
import {allowedVersions} from "./allowedVersionsCommand";
import {ConsoleCommand} from "./types";
import {DependencyService} from "../../application/DependencyService";

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