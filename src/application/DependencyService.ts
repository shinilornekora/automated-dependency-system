import {DependencyManager} from "../domain/DependencyManager";
import {NpmService} from "../infrastructure/NpmService";
import {Dependency} from "../domain/Dependency";
import {CommandHandler} from "../domain/Command";
import {PROTECTED_COMMANDS} from "../domain/types/protectedCommands";
import {COMMON_COMMANDS} from "../domain/types/commonCommands";

type Props = {
    dependencyManager: DependencyManager;
    log: (message: string) => void;
    commandHandler: CommandHandler;
    npmService: NpmService;
}

export class DependencyService {
    private dependencyManager: DependencyManager;
    private commandHandler: CommandHandler;
    private npmService: NpmService;
    private readonly log: (message: string) => void;
    
    constructor({ dependencyManager, npmService, commandHandler, log }: Props) {
      this.dependencyManager = dependencyManager;
      this.commandHandler = commandHandler;
      this.npmService = npmService;
      this.log = log;
    }
  
    async runADSChecks() {
        await this.dependencyManager.checkAndResolveCVEs();
        this.dependencyManager.removeUnusedDependencies();
        this.lockAllCurrentVersions();
    }
  
    lockAllCurrentVersions() {
        this.log("Locking all current dependency versions.");
        const deps = this.dependencyManager.dependencyRepository.getAll();
        deps.forEach(dep => {
            this.log(dep.getName);

            dep.markReadOnly();
        })
    }
  
    async runNpmCommand(command: string, args: string[] = []) {
      await this.runADSChecks();
      this.npmService.run(command, args);
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