const Dependency = require('./Dependency');
const semver = require('semver');
const path = require('path');
const fs = require('fs');

class DependencyManager {
    constructor({ dependencyRepository, cveScanner, currentUser, melIgnoreList = [] }) {
        this.dependencyRepository = dependencyRepository;
        this.cveScanner = cveScanner;
        this.currentUser = currentUser;
        this.melIgnoreList = melIgnoreList;
    }

    async syncWithPackageJson() {
        const resolvedPackageJson = path.resolve('package.json');
        const packageJSONContent = String(fs.readFileSync(resolvedPackageJson));

        try {
            Object.entries(JSON.parse(packageJSONContent).dependencies)
                .forEach(([ name, version ]) => {
                    this.addDependency({
                        name,
                        version,
                        maintainer: this.currentUser,
                        readOnly: false,
                        isLocal: false
                    })
                })
        } catch (err) {
            console.log(err);
            throw new Error('Package.json is invalid or there is no alike file.');
        }
    }

    addDependency(dependencyData) {
        if (dependencyData.maintainer !== this.currentUser) {
            throw new Error(`Only the maintainer (${dependencyData.maintainer}) can add dependency ${dependencyData.name}.`);
        }

        if (this.dependencyRepository.get(dependencyData.name)) {
            return console.log(`Dependency ${dependencyData.name} already exists.`);
        }

        const dep = new Dependency(dependencyData);
        dep.markReadOnly();

        this.dependencyRepository.add(dep);
        console.log(`Dependency ${dep.name} added with version ${dep.version} as read-only.`);

        return dep;
    }

    removeDependency(dependencyName) {
        const dep = this.dependencyRepository.get(dependencyName);

        if (!dep) {
            throw new Error(`Dependency ${dependencyName} not found.`);
        }

        if (dep.maintainer !== this.currentUser) {
            throw new Error(`Only the maintainer (${dep.maintainer}) can remove dependency ${dependencyName}.`);
        }
        
        this.dependencyRepository.remove(dependencyName);
        console.log(`Dependency ${dependencyName} removed.`);
    }

    blockInstallOperation() {
        throw new Error("Install-changing operations are blocked by ADS. Use ADS commands to manage dependencies.");
    }

    async checkAndResolveCVEs() {
        const dependencies = this.dependencyRepository.getAll();
        for (const dep of dependencies) {
            if (dep.isLocal) {
                console.log(`Local dependency pointer detected for ${dep.name}. Removing immediately.`);
                this.dependencyRepository.remove(dep.name);
                continue;
            }
            try {
                const cveReport = await this.cveScanner.scan(dep);
                if (cveReport.severity === 'high' || cveReport.severity === 'critical') {
                    // For high/critical CVEs, attempt to downgrade.
                    const secureVersion = this.getSecureVersion(dep.version);
                    console.log(`High/Critical vulnerability found in ${dep.name}. Attempting downgrade from ${dep.version} to ${secureVersion}.`);
                    
                    if (!dep.readOnly) {
                        dep.updateVersion(secureVersion);
                    } else {
                        console.warn(`Dependency ${dep.name} is read-only; cannot downgrade.`);
                    }
                } else if (cveReport.severity === 'fixed') {
                    // If the vulnerability is fixed, attempt to upgrade.
                    const latestVersion = cveReport.fixedVersion;
                    console.log(`Vulnerability fixed for ${dep.name}. Attempting upgrade from ${dep.version} to ${latestVersion}.`);
                    if (!dep.readOnly) {
                        dep.updateVersion(latestVersion);
                    } else {
                        console.warn(`Dependency ${dep.name} is read-only; cannot upgrade.`);
                    }
                }
                dep.updateLastUsed();
            } catch (err) {
                console.error(`Error scanning ${dep.name}: ${err.message}`);
            }
        }
    }

    getSecureVersion(currentVersion) {
        // Example: downgrade by reducing the minor version.
        const parts = currentVersion.split('.');
        if (parts.length < 2) return currentVersion;
        let major = parts[0];
        let minor = parseInt(parts[1], 10);
        let patch = parts[2] || '0';
        if (minor > 0) {
        minor = minor - 1;
        }
        return `${major}.${minor}.${patch}`;
    }

    removeUnusedDependencies() {
        const now = Date.now();
        const threshold = 5 * 60 * 60 * 1000; // 5 hours in ms
        const dependencies = this.dependencyRepository.getAll();
        for (const dep of dependencies) {
        if ((now - dep.lastUsed) > threshold) {
            console.log(`Dependency ${dep.name} has not been used for over 5 hours. Removing...`);
            this.dependencyRepository.remove(dep.name);
        }
        }
    }

    checkMelIgnore(dependencyName) {
        return this.melIgnoreList.includes(dependencyName);
    }

    async getAllowedVersions(dependencyName) {
        console.log(`Fetching allowed versions for ${dependencyName} (three most recent).`);
        const { execSync } = require('child_process');
        try {
        const output = execSync(`npm view ${dependencyName} versions --json`).toString();
        const versions = JSON.parse(output);
        // Return the three most recent versions.
        return versions.slice(-3).reverse();
        } catch (err) {
        console.error(`Error fetching versions for ${dependencyName}: ${err.message}`);
        return [];
        }
    }
}

module.exports = DependencyManager;
