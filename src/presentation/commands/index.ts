import { installCommand } from "./installCommand.js";
import { checkCommand } from "./checkCommand.js";
import { buildCommand } from "./buildCommand.js";
import { cleanInstallCommand } from "./cleanInstallCommand.js";
import { addCommand } from "./addCommand.js";
import { removeCommand } from "./removeCommand.js";
import { resolveCommand } from "./resolveCommand.js";
import { allowedVersions } from "./allowedVersionsCommand.js";
import { ConsoleCommand } from "./types.js";
import { DependencyService } from "../../application/DependencyService.js";
import { initCommand } from "./initCommand.js";
import { startCommand } from "./startCommand.js";

export const commands = (service: DependencyService): ConsoleCommand[] => {
    return [
        installCommand,
        checkCommand,
        buildCommand,
        cleanInstallCommand,
        addCommand,
        initCommand,
        removeCommand,
        resolveCommand,
        allowedVersions,
        startCommand
    ].map(command => command(service));
}