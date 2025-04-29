import {ConsoleCommand} from "./types";
import {DependencyService} from "../../application/DependencyService";

export const cleanInstallCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'clean-install',
    description: "Run npm clean-install (ci) with ADS checks",
    action: async () => {
        await service.runNpmCommand('ci');
    }
})