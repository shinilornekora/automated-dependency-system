import {ConsoleCommand} from "./types";
import {DependencyService} from "../../application/DependencyService";

export const resolveCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'resolve',
    description: '[EXPERIMENTAL]: Try to resolve package.json conflicts',
    action: async () => {
        // пока стаб
    }
})