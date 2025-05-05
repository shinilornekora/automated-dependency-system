type Props = {
    name: string;
    version: string;
    maintainer: string | null;
    readOnly: boolean;
    resolvedByGPT?: boolean,
    lastUsed?: number;
    isLocal?: boolean;
}

export class Dependency {
    public readonly name: string;
    public version: string;
    readonly maintainer: string | null;
    public readOnly: boolean;
    public readonly resolvedByGPT: boolean | undefined;
    public lastUsed: number;
    public readonly isLocal: boolean | undefined;

    constructor({ name, version, maintainer, resolvedByGPT, readOnly, lastUsed, isLocal }: Props) {
        this.name = name;
        this.version = version;
        this.maintainer = maintainer;
        this.resolvedByGPT = resolvedByGPT;
        this.readOnly = readOnly;
        this.lastUsed = lastUsed ?? Date.now();
        this.isLocal = isLocal;
    }
    
    updateVersion(newVersion: string) {
        if (this.readOnly) {
          throw new Error(`Dependency ${this.name} is read-only and cannot be updated.`);
        }

        this.version = newVersion;
    }
    
    public markReadOnly() {
        this.readOnly = true;
    }

    public get isReadOnly() {
        return this.readOnly;
    }

    public get getName() {
        return this.name;
    }

    public get getVersion() {
        return this.version;
    }

    public get isResolvedByGPT() {
        return this.resolvedByGPT;
    }

    get getIsLocal() {
        return this.isLocal;
    }

    get getLastUsed() {
        return this.lastUsed
    }

    public updateLastUsed() {
        this.lastUsed = Date.now();
    }
}
  