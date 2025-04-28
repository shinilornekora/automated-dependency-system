type UserProps = {
    name: string;
    isPackageMaintainer: boolean;
}

export class User {
    public isPackageMaintainer: Boolean;
    private readonly name: string;

    constructor({ name, isPackageMaintainer }: UserProps) {
        this.name = name;
        this.isPackageMaintainer = isPackageMaintainer;
    }

    public get getName() {
        return this.name;
    }
}