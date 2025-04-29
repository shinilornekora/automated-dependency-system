import {ConsoleCommand} from "./types";
import {DependencyService} from "../../application/DependencyService";

export const buildCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'build',
    description: "Run npm build with ADS checks",
    action: async () => {
        await service.runNpmCommand('run', ['build']);
    }
})