import { Dependency } from '../domain/Dependency.js';
import { FileSystemAPI } from "./FileSystemAPI.js";

/**
 * Класс для управления зависимостями через ADS.
 * Осуществляет сверку и перезапись зависимостей в .ads файлах
 */
export class DependencyRepository {
    private dependencies: Map<string, Dependency>;

    constructor() {
        this.dependencies = new Map<string, Dependency>();
        this.load();
    }

    /**
     * Инициализация конфигурационным файлом.
     */
    private load() {
        try {
            const deps = FileSystemAPI.readDependencyADSFile();

            for (const dep of deps) {
                this.dependencies.set(dep.name, dep);
            }
        } catch (err) {
            console.error(`Error loading dependencies`);
        }
    }

    /**
     * Сохраняем текущее состояние в файл зависимостей.
     * Важно чтобы разработчик был в корне проекта.
     */
    private save() {
        try {
            const melIngnoreFile = FileSystemAPI.readMelIgnore();
            const packageJSON = FileSystemAPI.readPackageJson();
            const depsArray = Array.from(this.dependencies.values());
            const newDeps: Record<string, string> = {};

            depsArray.forEach(dep => {
                if (dep.name) {
                    newDeps[dep.name] = dep.version;
                    return;
                }

                newDeps[dep.getName] = dep.getVersion;
            });

            FileSystemAPI.saveDependencyADSFile(depsArray);

            const newDepsNames = Object.keys(newDeps);

            for (const ignoredDepName of melIngnoreFile) {
                const droppedIgnoredDep = !newDepsNames.includes(ignoredDepName);
                const ignoredDepExists = packageJSON.dependencies[ignoredDepName]

                // Система попыталась удалить защищенную зависимость.
                // Не даем так сделать.
                if (droppedIgnoredDep && ignoredDepExists) {
                    newDeps[ignoredDepName] = packageJSON.dependencies[ignoredDepName].version;
                }
            }

            FileSystemAPI.writePackageJson({
                ...packageJSON,
                dependencies: newDeps
            });
        } catch (err) {
            console.log(err)
            console.error(`Error saving dependencies`);
        }
    }

    /**
     * Добавляем одну зависимость.
     * @param dependency
     */
    add(dependency: Dependency) {
        const melignoreFile = FileSystemAPI.readMelIgnore();

        if (melignoreFile.includes(dependency.getName)) {
            throw new Error(`Dependency ${dependency.getName} is included in .melignore file and won\'t be added to ADS control unit.`);
        }

        this.dependencies.set(dependency.getName, dependency);
        this.save();
    }

    /**
     * Добавляем много зависимостей.
     * @param deps
     */
    public addAll(deps: Dependency[]) {
        for (const dep of deps) {
            this.dependencies.set(dep.getName, dep);
        }

        this.save();
    }

    /**
     * Получаем зависимость.
     * Ключом будет являться имя зависимости.
     * @param name
     */
    public get(name: string) {
        return this.dependencies.get(name);
    }

    /**
     * Убираем зависимость по имени.
     * @param name
     */
    public remove(name: string) {
        this.dependencies.delete(name);
        this.save();
    }

    /**
     * Получаем все зависимости.
     */
    public getAll() {
        return Array.from(this.dependencies.values());
    }
}
