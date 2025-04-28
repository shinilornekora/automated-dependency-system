import {Dependency} from './Dependency';
import * as path from 'path';
import * as fs from 'fs';
import {User} from './User';
import {CVEScanner} from '../infrastructure/CVEScanner';
import {DependencyResolver} from './DependencyResolver';
import {DependencyRepository} from '../infrastructure/DependencyRepository';

type Props = {
    currentUser: User;
    cveScanner: CVEScanner;
    dependencyResolver: DependencyResolver;
    dependencyRepository: DependencyRepository;
    melIgnoreList: string[];
}

export class DependencyManager {
    private readonly currentUser: User;
    private cveScanner: CVEScanner;
    private dependencyResolver: DependencyResolver;
    dependencyRepository: DependencyRepository;
    private melIgnoreList: string[];

    constructor({
        dependencyRepository,
        dependencyResolver,
        cveScanner,
        currentUser,
        melIgnoreList = []
    }: Props) {
        this.dependencyRepository = dependencyRepository;
        this.dependencyResolver = dependencyResolver;
        this.cveScanner = cveScanner;
        this.currentUser = currentUser;
        this.melIgnoreList = melIgnoreList;
    }

    async updateConfigurationFile(payload: unknown) {
        // пока стабим
    }

    async syncWithPackageJson() {
        const resolvedPackageJson = path.resolve('package.json');
        const packageJSONContent = String(fs.readFileSync(resolvedPackageJson));

        try {
            Object.entries<string>(JSON.parse(packageJSONContent).dependencies)
                .forEach(([name, version]) => {
                    const dep = new Dependency({
                        name,
                        version,
                        maintainer: this.currentUser.getName,
                        readOnly: false,
                        isLocal: false

                    })
                    this.addDependency(dep);
                })
        } catch (err) {
            console.log(err);
            throw new Error('Package.json is invalid or there is no alike file.');
        }
    }

    addDependency(dependencyData: Dependency) {
        if (!this.currentUser.isPackageMaintainer) {
            throw new Error(`Only the maintainer (${dependencyData.maintainer}) can add dependency ${dependencyData.getName}.`);
        }

        if (this.dependencyRepository.get(dependencyData.getName)) {
            return console.log(`Dependency ${dependencyData.getName} already exists.`);
        }

        const dep = dependencyData;
        dep.markReadOnly();

        this.dependencyRepository.add(dep);
        console.log(`Dependency ${dep.getName} added with version ${dep.getVersion} as read-only.`);

        return dep;
    }

    removeDependency(dependencyName: string) {
        const dep = this.dependencyRepository.get(dependencyName);

        if (!dep) {
            throw new Error(`Dependency ${dependencyName} not found.`);
        }

        if (!this.currentUser.isPackageMaintainer) {
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
            if (dep.getIsLocal) {
                console.log(`Local dependency pointer detected for ${dep.getName}. Removing immediately.`);
                this.dependencyRepository.remove(dep.getName);
                continue;
            }
            try {
                const cveReport = await this.cveScanner.scan(dep);
                if (cveReport.severity === 'high' || cveReport.severity === 'critical') {
                    // For high/critical CVEs, attempt to downgrade.
                    const secureVersion = this.getSecureVersion(dep.getVersion);

                    console.log(`
                        High/Critical vulnerability found in ${dep.getName}.\n
                        Attempting downgrade from ${dep.getVersion} to ${secureVersion}.\n
                    `);

                    if (!dep.isReadOnly) {
                        dep.updateVersion(secureVersion);
                    } else {
                        console.warn(`Dependency ${dep.getName} is read-only; cannot downgrade.`);
                    }
                } else if (cveReport.severity === 'fixed') {
                    // If the vulnerability is fixed, attempt to upgrade.
                    const latestVersion = cveReport.fixedVersion;
                    console.log(`Vulnerability fixed for ${dep.getName}. Attempting upgrade from ${dep.getVersion} to ${latestVersion}.`);
                    if (!dep.isReadOnly) {
                        dep.updateVersion(latestVersion);
                    } else {
                        console.warn(`Dependency ${dep.getName} is read-only; cannot upgrade.`);
                    }
                }
                dep.updateLastUsed();
            } catch (err) {
                console.error(`Error scanning ${dep.getName}`);
            }
        }
    }

    getSecureVersion(currentVersion: string) {
        // Example: downgrade by reducing the minor version.
        const parts = currentVersion.split('.');

        if (parts.length < 2) {
            return currentVersion;
        }

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
        const threshold = 5 * 60 * 60 * 1000;
        const dependencies = this.dependencyRepository.getAll();

        for (const dep of dependencies) {
            if ((now - dep.getLastUsed) > threshold) {
                console.log(`Dependency ${dep.getName} has not been used for over 5 hours. Removing...`);
                this.dependencyRepository.remove(dep.getName);
            }
        }
    }

    checkMelIgnore(dependencyName: string) {
        return this.melIgnoreList.includes(dependencyName);
    }


    async getAllowedVersions(dependencyName: string) {
        console.log(`Fetching allowed versions for ${dependencyName} (three most recent).`);
        const { execSync } = require('child_process');

        try {
            const output = execSync(`npm view ${dependencyName} versions --json`).toString();
            const versions = JSON.parse(output) as string[];

            // Регулярное выражение для фильтрации версий в формате x.x.x
            const semverRegex = /^\d+\.\d+\.\d+$/;

            // Фильтрация версий и возврат трех последних
            return versions
                .filter(version => semverRegex.test(version))
                .slice(-3)
                .reverse();
        } catch (err) {
            console.error(`Error fetching versions for ${dependencyName}`);
            return [];
        }
    }
}
