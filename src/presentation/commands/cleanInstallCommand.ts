import { ConsoleCommand } from "./types.js";
import { DependencyService } from "../../application/DependencyService.js";

export const cleanInstallCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'clean-install',
    description: "[UP]: Run clean install with ADS checks",
    action: async () => {
        await service.cleanInstallDeps();
    }
})