import { User } from "./User";
import { Dependency } from "./Dependency";

type ProjectProps = {
    dependencies: Dependency[];
    melignoreFile: Record<string, string>;
    packageJSON: Record<string, string>;
    ADSFile: Record<string, string>;
    user: User;
}

/**
 * Класс для централизованного описания всего проекта.
 * Отсюда можно прочитать в любой момент любой конфигурационный файл.
 */
export class Project {
    private readonly dependencies: Dependency[];
    private melignoreFile: Record<string, string>;
    private packageJSON: Record<string, string>;
    private ADSFile: Record<string, string>;
    private user: User;

    constructor({
        melignoreFile,
        packageJSON,
        dependencies,
        ADSFile,
        user
    }: ProjectProps) {
        this.dependencies = dependencies;
        this.melignoreFile = melignoreFile;
        this.ADSFile = ADSFile;
        this.user = user;
        this.packageJSON = packageJSON;
    }

    public get getDependencies() {
        return this.dependencies;
    }

    public get maintainer() {
        return this.packageJSON.author;
    }
}