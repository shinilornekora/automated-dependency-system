import {ConsoleCommand} from "./types";
import {DependencyService} from "../../application/DependencyService";

export const installCommand = (dependencyService: DependencyService): ConsoleCommand => ({
    command: 'install',
    description: "Run npm install with ADS checks (installing from package.json only)",
    option: ['--args <args>', 'Additional arguments for npm install', ''],
    action: async (cmdObj) => {
        const args = cmdObj.args ? cmdObj.args.split(' ') : [];
        await dependencyService.runNpmCommand('install', args);
    }
});