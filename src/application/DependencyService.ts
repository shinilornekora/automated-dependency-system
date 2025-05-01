import {DependencyManager} from "../domain/DependencyManager.js";
import {Dependency} from "../domain/Dependency.js";
import {CommandHandler} from "../domain/CommandHandler.js";
import {PROTECTED_COMMANDS} from "../domain/types/protectedCommands.js";
import {COMMON_COMMANDS} from "../domain/types/commonCommands.js";

type Props = {
    dependencyManager: DependencyManager;
    log: (message: string) => void;
    commandHandler: CommandHandler;
}

export class DependencyService {
    private dependencyManager: DependencyManager;
    private commandHandler: CommandHandler;
    private readonly log: (message: string) => void;
    
    constructor({ dependencyManager, commandHandler, log }: Props) {
        this.dependencyManager = dependencyManager;
        this.commandHandler = commandHandler;
        this.log = log;
    }

    async initADS() {
        return await this.commandHandler.handle({
            type: COMMON_COMMANDS.INIT_ADS,
            payload: {}
        })
    }

    async triggerADSBuild() {
        return await this.commandHandler.handle({
            type: COMMON_COMMANDS.TRIGGER_ADS_BUILD,
            payload: {}
        })
    }

    async runADSChecks() {
        return await this.commandHandler.handle({
            type: COMMON_COMMANDS.INIT_ADS,
            payload: {}
        })
    }

    async installDeps(...payload: string[]) {
        return await this.commandHandler.handle({
            type: COMMON_COMMANDS.INSTALL_DEPENDENCIES,
            payload
        })
    }

    async cleanInstallDeps() {
        return await this.commandHandler.handle({
            type: COMMON_COMMANDS.CLEAN_INSTALL_DEPENDENCIES,
            payload: {}
        })
    }

    async getMaintainerUserName() {
        return await this.commandHandler.handle({
            type: COMMON_COMMANDS.GET_MAINTAINER,
            payload: {}
        });
    }

    addDependency(dep: Dependency) {
        return this.commandHandler.handle({
            type: PROTECTED_COMMANDS.ADD_DEPENDENCY,
            payload: dep
        });
    }

    getAllowedVersions(name: string) {
        return this.commandHandler.handle({
            type: COMMON_COMMANDS.SHOW_THREE_VERSIONS,
            payload: {
                depName: name
            }
        });
    }

    removeDependency(name: string) {
        return this.commandHandler.handle({
            type: PROTECTED_COMMANDS.DELETE_DEPENDENCY,
            payload: {
                depName: name
            }
        });
    }

    resolveConflicts() {
        return this.commandHandler.handle({
            type: COMMON_COMMANDS.RESOLVE_CONFLICTS,
            payload: {}
        })
    }
}