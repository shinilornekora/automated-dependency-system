import {ConsoleCommand} from "./types.js";
import {DependencyService} from "../../application/DependencyService.js";

export const removeCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'remove <name>',
    description: "Remove a dependency via ADS (only for maintainers)",
    action: async (name) => {
        try {
            service.removeDependency(name);
            console.log(`Removed dependency ${name}.`);
        } catch (err) {
            console.error(`Error while trying to remove dependency ${name}.`);
        }
    }
})