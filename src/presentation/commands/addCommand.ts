import {Command} from "commander";
import {Dependency} from "../../domain/Dependency";
import {ConsoleCommand} from "./types";
import {DependencyService} from "../../application/DependencyService";

// TODO: разобраться с этим добром
export const addCommand = (service: DependencyService): ConsoleCommand => ({
    command: 'add <name> <version>',
    description: "Add a new dependency via ADS (only for maintainers)",
    action: async ([ name, version ]) => {
        try {
            const userName = service.getMaintanerUserName();
            const dep = new Dependency({
                name,
                version,
                maintainer: userName,
                readOnly: false,
                isLocal: false
            })

            service.addDependency(dep);
            console.log(`Added dependency ${name}@${version}.`);
        } catch (err) {
            console.error(`Failed to add dependency ${name}.`);
        }
    }
})