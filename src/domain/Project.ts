import { User } from "./User.js";
import { Dependency } from "./Dependency.js";

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
    private melignoreFile: Record<string, string>;
    private packageJSON: Record<string, string>;
    private ADSFile: Record<string, string>;
    private user: User;

    constructor({
        melignoreFile,
        packageJSON,
        ADSFile,
        user
    }: ProjectProps) {
        this.melignoreFile = melignoreFile;
        this.ADSFile = ADSFile;
        this.user = user;
        this.packageJSON = packageJSON;
    }

    public get maintainer() {
        return this.packageJSON.author;
    }
}