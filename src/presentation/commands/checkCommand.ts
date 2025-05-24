import { ConsoleCommand } from "./types.js";
import { DependencyService } from "../../application/DependencyService.js";

export const checkCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'check',
    description: "[UP]: Run common ADS check.txt (CVE scan + resolving conflicts + marking deps as read-only)",
    action: async () => {
        console.log("Running ADS checks...");
        await service.runADSChecks();

        console.log("ADS checks complete.");
    }
});
