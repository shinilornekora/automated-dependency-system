const fs = require('fs');
const path = require('path');
const Dependency = require('../domain/Dependency');
const DEP_FILE = path.join(process.cwd(), '.ads', 'dependencies.json');

export class DependencyRepository {
    constructor() {
        this.dependencies = new Map();
        this.load();
    }

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
            console.error(`Error loading dependencies: ${err.message}`);
        }
    }

    save() {
        try {
            const dir = require('path').dirname(DEP_FILE);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            const depsArray = Array.from(this.dependencies.values());
            fs.writeFileSync(DEP_FILE, JSON.stringify(depsArray, null, 2), 'utf-8');
        } catch (err) {
            console.error(`Error saving dependencies: ${err.message}`);
        }
    }

    add(dependency) {
        this.dependencies.set(dependency.name, dependency);
        this.save();
    }

    get(name) {
        return this.dependencies.get(name);
    }

    remove(name) {
        this.dependencies.delete(name);
        this.save();
    }

    getAll() {
        return Array.from(this.dependencies.values()).map(dep => new Dependency(dep))
    }
}
