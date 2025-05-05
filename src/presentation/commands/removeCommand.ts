import { ConsoleCommand } from "./types.js";
import { DependencyService } from "../../application/DependencyService.js";

export const removeCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'remove <name>',
    description: "[FP]: Remove dependency from project",
    action: async (name) => {
        try {
            await service.removeDependency(name);
            console.log(`Removed dependency ${name}.`);
        } catch (err) {
            console.log(err)
            console.error(`Error while trying to remove dependency ${name}.`);
        }
    }
})