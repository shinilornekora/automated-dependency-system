import {ConsoleCommand} from "./types.js";
import {DependencyService} from "../../application/DependencyService.js";

export const checkCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'check',
    description: "Run ADS checks (CVE scan, remove unused dependencies, lock versions)",
    action: async () => {
        // await dependencyManager.syncWithPackageJson();
        console.log("Running ADS checks...");
        await service.runADSChecks();

        console.log("ADS checks complete.");
    }
})