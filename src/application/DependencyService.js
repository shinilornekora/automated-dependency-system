class DependencyService {
    constructor({ dependencyManager, npmService }) {
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
  
    async runNpmCommand(command, args = []) {
      await this.runADSChecks();
      this.npmService.run(command, args);
    }
  }
  
  module.exports = DependencyService;
  