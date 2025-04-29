import { DependencyManager } from "../domain/DependencyManager";
import { NpmService } from "../infrastructure/NpmService";
import {Dependency} from "../domain/Dependency";

type Props = {
    dependencyManager: DependencyManager;
    npmService: NpmService;
}

export class DependencyService {
    private dependencyManager: DependencyManager;
    private npmService: NpmService;
    
    constructor({ dependencyManager, npmService }: Props) {
      this.dependencyManager = dependencyManager;
      this.npmService = npmService;
    }
  
    async runADSChecks() {
      console.log("Running ADS checks...");
      await this.dependencyManager.checkAndResolveCVEs();
      this.dependencyManager.removeUnusedDependencies();
      this.lockAllCurrentVersions();
    }
  
    lockAllCurrentVersions() {
      console.log("Locking all current dependency versions.");
      const deps = this.dependencyManager.dependencyRepository.getAll();
      deps.forEach(dep => {
        console.log(dep);

        dep.markReadOnly();
      })
    }
  
    async runNpmCommand(command: string, args: string[] = []) {
      await this.runADSChecks();
      this.npmService.run(command, args);
    }

    getMaintanerUserName() {
        return null;
    }

    addDependency(dep: Dependency) {
        return null;
    }

    getAllowedVersions(name: string) {
        return null;
    }

    removeDependency(name: string) {
        return null;
    }
}