import {ConsoleCommand} from "./types.js";
import {DependencyService} from "../../application/DependencyService.js";

export const buildCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'build',
    description: "Run npm build with ADS checks",
    action: async () => {
        await service.triggerADSBuild();
    }
})