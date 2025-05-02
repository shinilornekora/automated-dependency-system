import { ConsoleCommand } from "./types.js";
import { DependencyService } from "../../application/DependencyService.js";

export const cleanInstallCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'clean-install',
    description: "Run npm clean-install (ci) with ADS checks",
    action: async () => {
        await service.cleanInstallDeps();
    }
})