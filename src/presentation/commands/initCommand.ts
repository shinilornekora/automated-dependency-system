import { ConsoleCommand } from "./types.js";
import { DependencyService } from "../../application/DependencyService.js";

export const initCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'init',
    description: "Run ADS checks (CVE scan, remove unused dependencies, lock versions)",
    action: async () => {
        console.log("Running ADS initialization...");
        await service.initADS();

        console.log("ADS initialization complete.");
    }
})