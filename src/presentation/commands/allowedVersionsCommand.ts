import { ConsoleCommand } from "./types.js";
import { DependencyService } from "../../application/DependencyService.js";

export const allowedVersions = (service: DependencyService): ConsoleCommand => ({
    command: 'allowed-versions <name>',
    description: "[UP]: Show three permitted versions of dependency",
    action: async (name) => {
        const versions = await service.getAllowedVersions(name);
        console.log(`Allowed versions for ${name}:`, versions);
    }
})