import {ConsoleCommand} from "./types";
import {DependencyService} from "../../application/DependencyService";

export const checkCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'check',
    description: "Run ADS checks (CVE scan, remove unused dependencies, lock versions)",
    action: async () => {
        // await dependencyManager.syncWithPackageJson();
        await service.runADSChecks();

        console.log("ADS checks complete.");
    }
})