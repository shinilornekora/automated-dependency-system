import { Dependency } from "../../domain/Dependency.js";
import { ConsoleCommand } from "./types.js";
import { DependencyService } from "../../application/DependencyService.js";

export const addCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'add <name> <version>',
    description: "[FP]: Add new dependency to the project",
    action: async (...args) => {
        const [name, version] = args as unknown as Readonly<[string, string]>;

        try {
            const userName = await service.getMaintainerUserName();
            const dep = new Dependency({
                name,
                version,
                maintainer: userName,
                readOnly: false,
                isLocal: false
            })

            console.log(dep);

            await service.addDependency(dep);
            console.log(`Added dependency ${name}@${version}.`);
        } catch (err) {
            console.error(`Failed to add dependency ${name}.`);
        }
    }
})