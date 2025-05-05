import * as fs from 'fs';
import * as path from 'path';
import { Dependency } from "../domain/Dependency.js";

const melIgnoreDefaultPath = path.join(process.cwd(), '.melignore');
const packageJsonPath = path.join(process.cwd(), 'package.json');
const dependencyPath = path.join(process.cwd(), '.ads', 'dependencies.json');

/**
 * Класс для работы с нужными для ADS файлами.
 */
export class FileSystemAPI {
    /**
     * Метод для чтения конфигурационного файла ADS.
     * @param filePath
     */
    public static readMelIgnore(filePath = melIgnoreDefaultPath) {
        try {
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf-8').split('\n').map(line => line.trim()).filter(line => line);
            }

            return [];
        } catch (err) {
            console.error(`Error reading .melignore`);
            return [];
        }
    }

    /**
     * Метод для чтения пакета в проекте.
     * @param filePath
     */
    public static readPackageJson(filePath = packageJsonPath) {
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                return JSON.parse(data);
            }
            return null;
        } catch (err) {
            console.error(`Error reading package.json.`);
            return null;
        }
    }

    /**
     * Метод для записи изменений в package.json.
     * @param packageData - объект, который будет записан в package.json
     * @param filePath
     */
    public static writePackageJson(packageData: any, filePath = packageJsonPath) {
        try {
            const json = JSON.stringify(packageData, null, 2) + '\n';
            fs.writeFileSync(filePath, json, 'utf-8');
            return true;
        } catch (err) {
            console.error('Error writing package.json.');
            return false;
        }
    }

    public static readDependencyADSFile(filePath = dependencyPath) {
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf-8');
                return JSON.parse(data);
            }
            return null;
        } catch (err) {
            console.error(err)
            console.error(`Error reading package.json.`);
            return null;
        }
    };

    public static saveDependencyADSFile(dependencies: Dependency[], filePath = dependencyPath) {
        try {
            const dir = path.dirname(filePath);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            const depsArray = Array.from(dependencies);
            fs.writeFileSync(filePath, JSON.stringify(depsArray, null, 2), 'utf-8');
        } catch (err) {
            console.log(err);
            console.error(`Error saving dependencies`);
            return null;
        }
    }
}
