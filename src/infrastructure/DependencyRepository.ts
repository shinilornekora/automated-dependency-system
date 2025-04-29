import { Dependency } from '../domain/Dependency';
import { FileSystemAPI } from "./FileSystemAPI";

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
     * Сохранение новый зависимостей в файл.
     */
    private save() {
        try {
            const depsArray = Array.from(this.dependencies.values());

            FileSystemAPI.saveDependencyADSFile(depsArray);
        } catch (err) {
            console.error(`Error saving dependencies`);
        }
    }

    /**
     * Добавляем одну зависимость.
     * @param dependency
     */
    add(dependency: Dependency) {
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
