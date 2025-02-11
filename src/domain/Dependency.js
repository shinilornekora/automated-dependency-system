class Dependency {
    constructor({ name, version, maintainer, resolvedByGPT = false, readOnly = false, lastUsed = Date.now(), isLocal = false }) {
      this.name = name;
      this.version = version;
      this.maintainer = maintainer;
      this.resolvedByGPT = resolvedByGPT;
      this.readOnly = readOnly;
      this.lastUsed = lastUsed;
      this.isLocal = isLocal;
    }
  
    updateVersion(newVersion) {
      if (this.readOnly) {
        throw new Error(`Dependency ${this.name} is read-only and cannot be updated.`);
      }
      this.version = newVersion;
    }
  
    markReadOnly() {
      this.readOnly = true;
    }
  
    updateLastUsed() {
      this.lastUsed = Date.now();
    }
  }
  
  module.exports = Dependency;