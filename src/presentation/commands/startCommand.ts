import { ConsoleCommand } from "./types.js";
import { DependencyService } from "../../application/DependencyService.js";

export const startCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'start',
    description: "[UP]: Start app via ADS",
    action: async () => {
        console.log("Running ADS checks...");
        await service.runStartApplication();

        console.log("ADS checks complete.");
    }
});
