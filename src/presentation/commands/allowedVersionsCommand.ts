import { ConsoleCommand } from "./types";
import {DependencyService} from "../../application/DependencyService";

export const allowedVersions = (service: DependencyService): ConsoleCommand => ({
    command: 'allowed-versions <name>',
    description: "Show the three most recent allowed versions for a dependency",
    action: async (name) => {
        const versions = await service.getAllowedVersions(name);
        console.log(`Allowed versions for ${name}:`, versions);
    }
})