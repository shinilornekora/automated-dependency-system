import { FileSystemAPI } from "../infrastructure/FileSystemAPI.js";

type UserProps = {
    name: string;
}

/**
 * Класс для описания текущего пользователя ADS.
 */
export class User {
    public isPackageMaintainer: Boolean;
    private readonly name: string;

    constructor({ name }: UserProps) {
        this.name = name;
        this.isPackageMaintainer = this.checkIfCurrentPackageMaintainsByUser() || false;
    }

    /**
     * Метод для проверки - является ли пользователь владельцем текущего проекта.
     * Если автора нет - считаем что он не автор пакета.
     */
    public checkIfCurrentPackageMaintainsByUser() {
        try {
            const packageJSONFile = FileSystemAPI.readPackageJson();

            if (!packageJSONFile.author) {
                console.error('Current package.json has no author field.');
                return false;
            }

            return packageJSONFile.author === this.getName;

        } catch (err) {
            console.error('Cannot read package.json file.');
            return null;
        }
    }

    public get getName() {
        return this.name;
    }
}