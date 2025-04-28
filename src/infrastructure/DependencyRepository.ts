import * as fs from 'fs';
import * as path from 'path';
import { Dependency } from '../domain/Dependency';

const DEP_FILE = path.join(process.cwd(), '.ads', 'dependencies.json');

// Слой доступа к зависимостям.
// Здесь берем все что было накидано в конфиг-файл и лочим
export class DependencyRepository {
    private dependencies: Map<string, Dependency>;

    constructor() {
        this.dependencies = new Map<string, Dependency>();
        this.load();
    }

    // Читаем набор зависимостей из файла
    load() {
        try {
            if (fs.existsSync(DEP_FILE)) {
                const data = fs.readFileSync(DEP_FILE, 'utf-8');
                const deps = JSON.parse(data);
                
                for (const dep of deps) {
                    this.dependencies.set(dep.name, dep);
                }
            }
        } catch (err) {
            console.error(`Error loading dependencies`);
        }
    }

    // Сохраняем все в файлик ADS
    save() {
        try {
            const dir = require('path').dirname(DEP_FILE);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            const depsArray = Array.from(this.dependencies.values());
            fs.writeFileSync(DEP_FILE, JSON.stringify(depsArray, null, 2), 'utf-8');
        } catch (err) {
            console.error(`Error saving dependencies`);
        }
    }

    // Добавление одной зависимости
    add(dependency: Dependency) {
        this.dependencies.set(dependency.getName, dependency);
        this.save();
    }

    // Получаем зависимость только по имени
    get(name: string) {
        return this.dependencies.get(name);
    }

    // Удаляем зависимость только по имени
    remove(name: string) {
        this.dependencies.delete(name);
        this.save();
    }

    // Получение всех зависимостей...
    // TODO: наверное сделать служебным
    getAll() {
        return Array.from(this.dependencies.values());
    }
}
