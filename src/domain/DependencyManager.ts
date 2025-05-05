import {Dependency} from './Dependency.js';
import {User} from './User.js';
import {CVEScanner} from '../infrastructure/CVEScanner.js';
import {DependencyResolver} from './DependencyResolver.js';
import {DependencyRepository} from '../infrastructure/DependencyRepository.js';
import {FileSystemAPI} from "../infrastructure/FileSystemAPI.js";
import {NpmService} from "../infrastructure/NpmService.js";

type Props = {
    currentUser: User;
    cveScanner: CVEScanner;
    dependencyResolver: DependencyResolver;
    dependencyRepository: DependencyRepository;
    melIgnoreList: string[];
    npmService: NpmService;
}

/**
 * Класс для управления операций с зависимостями.
 * Вызывается исключительно обработчиком команд.
 * Взаимодействует напрямую с инфраструктурой.
 */
export class DependencyManager {
    dependencyRepository: DependencyRepository;
    private readonly currentUser: User;
    private cveScanner: CVEScanner;
    private dependencyResolver: DependencyResolver;
    private melIgnoreList: string[];
    private npmService: NpmService;

    constructor({
        dependencyRepository,
        dependencyResolver,
        cveScanner,
        currentUser,
        npmService,
        melIgnoreList = []
    }: Props) {
        this.dependencyRepository = dependencyRepository;
        this.dependencyResolver = dependencyResolver;
        this.cveScanner = cveScanner;
        this.currentUser = currentUser;
        this.melIgnoreList = melIgnoreList;
        this.npmService = npmService;
    }

    async updateConfigurationFile(payload: unknown) {
        // пока стабим
    }

    async syncWithPackageJson() {
        try {
            const packageJSONContent = FileSystemAPI.readPackageJson();

            Object.entries<string>(packageJSONContent.dependencies)
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
        if (this.dependencyRepository.get(dependencyData.getName)) {
            return console.log(`Dependency ${dependencyData.getName} already exists.`);
        }

        const dep = dependencyData;
        dep.markReadOnly();

        this.dependencyRepository.add(dep);
        console.log(`Dependency ${dep.getName} added with version ${dep.getVersion} as read-only.`);

        return dep;
    }

    installDeps(payload: string[]) {
        this.npmService.run('install', payload);
    }

    cleanInstallDependencies() {
        this.npmService.run('ci');
    }

    triggerADSBuild() {
        this.npmService.run('run', ['build']);
    }

    removeDependency(dependencyName: string) {
        const dep = this.dependencyRepository.get(dependencyName);

        if (!dep) {
            throw new Error(`Dependency ${dependencyName} not found.`);
        }

        this.dependencyRepository.remove(dependencyName);
        console.log(`Dependency ${dependencyName} removed.`);
    }

    async checkAndResolveCVEs() {
        const dependencies = this.dependencyRepository.getAll().map(dep => new Dependency(dep));
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
                    if (!dep.isReadOnly && latestVersion) {
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

    lockAllCurrentVersions() {
        console.log("Locking all current dependency versions.");
        const deps = this.dependencyRepository.getAll().map(dep => new Dependency(dep));
        deps.forEach(dep => {
            if (dep.readOnly) {
                console.log(`Dependency ${dep.getName} is already read-only.`);
                return;
            }

            dep.markReadOnly();
            console.log(`Dependency ${dep.getName} is locked.`);
        });
    }

    async resolveConflicts() {
        const packageJSON = FileSystemAPI.readPackageJson();
        const { recommended, conflicts } = await this.dependencyResolver.suggestBestVersions(packageJSON.dependencies);

        if (Object.values(conflicts).length > 0) {
            console.log('Cannot resolve conflict. Two libraries are incompatible.');
            return;
        }

        packageJSON.dependencies = recommended;
        FileSystemAPI.writePackageJson(packageJSON);
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
        const dependencies = this.dependencyRepository.getAll().map(dep => new Dependency(dep));

        for (const dep of dependencies) {
            if ((now - dep.getLastUsed) > threshold) {
                console.log(`Dependency ${dep.getName} has not been used for over 5 hours. Removing...`);
                this.dependencyRepository.remove(dep.getName);
                continue;
            }

            console.log(`Dependency ${dep.getName} is actual.`)
        }
    }

    checkMelIgnore(dependencyName: string) {
        return this.melIgnoreList.includes(dependencyName);
    }


    async getAllowedVersions({ depName }: { depName: string }) {
        try {
            console.log(`Fetching allowed versions for ${depName} (three most recent).`);
            if (depName.isPrototypeOf(Object)) {
                console.log(JSON.stringify(depName))
            }
            const allVersions = await this.npmService.getAllowedSemverVersions(depName);
            const versions = allVersions.slice(allVersions.length - 3);

            console.log('Resolved versions: ', versions);
            return versions
        } catch (err) {
            console.error(`Error fetching versions for ${depName}`);
            return [];
        }
    }
}
