import { Dependency } from '../domain/Dependency.js';
import { FileSystemAPI } from "./FileSystemAPI.js";

export class DependencyRepository {
    private dependencies: Map<string, Dependency>;

    constructor() {
        this.dependencies = new Map<string, Dependency>();
        this.initialize();
    }

    private initialize() {
        this.clear();
        this.load();
    }

    private clear() {
        this.dependencies.clear();
    }

    private load() {
        try {
            const depsRaw = FileSystemAPI.readDependencyADSFile();

            if (!this._isValidDepsArray(depsRaw)) {
                this._logLoadError('Dependencies file empty or invalid');
                return;
            }
            for (const dep of depsRaw) {
                const depInstance = this._toDependency(dep);

                if (depInstance) {
                    this.dependencies.set(
                        depInstance.getName, 
                        depInstance
                    );
                }
            }
        } catch (err) {
            this._logLoadError(err);
        }
    }

    private _isValidDepsArray(deps: any): deps is any[] {
        return Array.isArray(deps);
    }

    private _toDependency(dep: any): Dependency | null {
        // Если dep уже объект типа Dependency, оставим его
        if (dep instanceof Dependency) {
            return dep;
        }
        
        if (dep && typeof dep === 'object' && dep.name && dep.version) {
            return new Dependency({ 
                name: dep.name, 
                version: dep.getVersion, 
                maintainer: 'nobody',
                readOnly: false,
            });
        }
        return null;
    }

    private _logLoadError(err: any) {
        process.stderr.write('[DependencyRepository][load] Error loading dependencies: ' + String(err) + '\n');
    }

    private save() {
        try {
            const melIgnoreFile = this._safeReadMelIgnore();
            const packageJSON = this._safeReadPackageJson();
            const depsArray = this._toArray(this.dependencies);
            const newDeps = this._depsArrayToRecord(depsArray);

            this._enforceMelIgnoreRules(newDeps, melIgnoreFile, packageJSON);

            FileSystemAPI.saveDependencyADSFile(depsArray);

            const newPackageJson = {
                ...packageJSON,
                dependencies: newDeps
            };

            FileSystemAPI.writePackageJson(newPackageJson);
        } catch (err) {
            this._logSaveError(err);
        }
    }

    private _safeReadMelIgnore(): string[] {
        try {
            const result = FileSystemAPI.readMelIgnore();

            return Array.isArray(result) ? result : [];
        } catch (err) {
            this._logFileSystemError('readMelIgnore', err);

            return [];
        }
    }

    private _safeReadPackageJson(): any {
        try {
            const pkg = FileSystemAPI.readPackageJson();

            return pkg ?? {};
        } catch (err) {
            this._logFileSystemError('readPackageJson', err);

            return {};
        }
    }

    private _depsArrayToRecord(depsArray: Dependency[]): Record<string, string> {
        const result: Record<string, string> = {};
        for (const dep of depsArray) {
            const name = dep.getName;
            const version = dep.getVersion;

            if (name) {
                result[name] = version;
            }
        }

        return result;
    }

    private _enforceMelIgnoreRules(
        newDeps: Record<string, string>, 
        melIgnoreFile: string[], 
        packageJSON: any
    ) {
        if (!Array.isArray(melIgnoreFile) || typeof packageJSON !== 'object' || packageJSON === null) {
            return;
        }

        const currentNames = Object.keys(newDeps);

        for (const ignoredName of melIgnoreFile) {

            if (typeof ignoredName !== 'string') {
                continue;
            }

            const isIgnoredMissing = !currentNames.includes(ignoredName);
            const existsInPackage = packageJSON.dependencies && packageJSON.dependencies[ignoredName];

            if (isIgnoredMissing && existsInPackage) {
                const srcDep = packageJSON.dependencies[ignoredName];
                const srcVersion = typeof srcDep === 'string' 
                    ? srcDep 
                    : (srcDep.version ?? srcDep);
                newDeps[ignoredName] = srcVersion;
            }
        }
    }

    private _logFileSystemError(method: string, err: any) {
        process.stderr.write(`[DependencyRepository][${method}] ${err}\n`);
    }

    private _logSaveError(err: any) {
        process.stderr.write('[DependencyRepository][save] Error saving dependencies: ' + String(err) + '\n');
    }

    private _toArray(deps: Map<string, Dependency>): Dependency[] {
        return Array.from(deps.values());
    }

    public add(dependency: Dependency) {
        if (!dependency || !(dependency instanceof Dependency)) {
            throw new Error('Invalid dependency');
        }

        const melIgnoreFile = this._safeReadMelIgnore();
        const depName = dependency.getName;

        if (melIgnoreFile.includes(depName)) {
            throw new Error(`
                Dependency ${depName} is included in .melignore file and won't be added to ADS control unit.
            `);
        }

        this.dependencies.set(depName, dependency);
        this.save();
    }

    public addAll(deps: Dependency[]) {
        if (!Array.isArray(deps)) {
            return;
        }

        for (const dep of deps) {
            const name = dep.getName;
            this.dependencies.set(name, dep);
        }

        this.save();
    }

    public get(name: string) {
        if (!name) {
            return;
        }

        return this.dependencies.get(name);
    }

    public remove(name: string) {
        if (!name) return;
        this.dependencies.delete(name);
        this.save();
    }

    public getAll(): Dependency[] {
        return Array.from(this.dependencies.values());
    }
}