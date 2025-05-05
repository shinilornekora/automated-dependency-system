import { ConsoleCommand } from "./types.js";
import { DependencyService } from "../../application/DependencyService.js";

export const resolveCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'resolve',
    description: '[UP]: Resolve package.json conflicts',
    action: async () => {
        await service.resolveConflicts();
    }
})