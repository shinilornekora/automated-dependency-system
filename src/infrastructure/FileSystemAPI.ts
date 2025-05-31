import * as fs from 'fs';
import * as path from 'path';
import { Dependency } from "../domain/Dependency.js";

const WINDOWS_DIVIDER = '\r\n';

const melIgnoreDefaultPath = path.join(process.cwd(), '.melignore');
const packageJsonPath = path.join(process.cwd(), 'package.json');
const dependencyPath = path.join(process.cwd(), '.ads', 'dependencies.json');

export class FileSystemAPI {
    public static readMelIgnore(filePath = melIgnoreDefaultPath): string[] {
        let lines: string[] = [];

        if (!this._fileExists(filePath)) {
            return lines;
        }

        try {
            const data = this._readFileData(filePath);
            const divider = this._getLineDivider(data);
            const splitLines = this._splitLines(data, divider);
            lines = this._filterNonEmptyLines(splitLines);
        } catch (err) {
            this._logMelignoreError(err);
        }

        return lines;
    }

    private static _fileExists(filePath: string): boolean {
        try {
            return fs.existsSync(filePath);
        } catch {
            return false;
        }
    }

    private static _readFileData(filePath: string): string {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
            throw new Error(`Could not read file: ${filePath}. ${err}`);
        }
    }

    private static _getLineDivider(data: string): string {
        if (data.includes(WINDOWS_DIVIDER)) return WINDOWS_DIVIDER;
        return '\n';
    }

    private static _splitLines(data: string, divider: string): string[] {
        return data.split(divider);
    }

    private static _filterNonEmptyLines(lines: string[]): string[] {
        const result: string[] = [];

        for (const l of lines) {
            if (typeof l === 'string' && l.trim().length > 0) {
                result.push(l.trim());
            }
        }

        return result;
    }

    private static _logMelignoreError(err: any) {
        process.stdout.write(String(err) + '\n');
        process.stderr.write('Error reading .melignore\n');
    }

    public static readPackageJson(filePath = packageJsonPath): any {
        if (!this._fileExists(filePath)) {
            return null;
        }

        try {
            const data = this._readFileData(filePath);

            return this._parseJsonData(data, filePath);
        } catch (err) {
            this._logReadPackageJsonError(err);

            return null;
        }
    }

    private static _parseJsonData(jsonString: string, filePath: string): any {
        try {
            return JSON.parse(jsonString);
        } catch (err) {
            throw new Error(`Could not parse JSON in file ${filePath}. ${err}`);
        }
    }

    private static _logReadPackageJsonError(err: any) {
        process.stderr.write(`ADS has not found any package.json file.\n`);
        
        if (err) {
            process.stderr.write(String(err) + '\n');
        }
    }

    public static writePackageJson(packageData: any, filePath = packageJsonPath): boolean {
        const json = this._stringifyJson(packageData, filePath);

        try {
            this._writeFile(filePath, json);
            return true;
        } catch (err) {
            this._logWritePackageJsonError(err);
            return false;
        }
    }

    private static _stringifyJson(obj: any, filePath: string): string {
        try {
            return JSON.stringify(obj, null, 2) + '\n';
        } catch (err) {
            throw new Error(`Failed to serialize JSON for ${filePath}: ${err}`);
        }
    }

    private static _writeFile(filePath: string, data: string) {
        try {
            fs.writeFileSync(filePath, data, 'utf-8');
        } catch (err) {
            throw new Error(`Failed to write file ${filePath}. ${err}`);
        }
    }

    private static _logWritePackageJsonError(err: any) {
        process.stderr.write('Error writing package.json.\n');
        
        if (err) {
            process.stderr.write(String(err) + '\n');
        }
    }

    public static readDependencyADSFile(filePath = dependencyPath): any {
        if (!this._fileExists(filePath)) {
            return null;
        }

        try {
            const data = this._readFileData(filePath);
            return this._parseJsonData(data, filePath);
        } catch (err) {
            this._logReadDepError(err);
            return null;
        }
    }

    private static _logReadDepError(err: any) {
        process.stderr.write(String(err) + '\n');
        process.stderr.write('Error reading package.json.\n');
    }

    public static saveDependencyADSFile(dependencies: Dependency[], filePath = dependencyPath): null | void {
        const dir = this._getDirPath(filePath);
        this._ensureDirExists(dir);
        const depsJson = this._getDependenciesJson(dependencies, filePath);

        try {
            this._writeFile(filePath, depsJson);
        } catch (err) {
            this._logSaveDepsError(err);
            return null;
        }
    }

    private static _getDirPath(filePath: string): string {
        return path.dirname(filePath);
    }

    private static _ensureDirExists(dirPath: string) {
        if (!fs.existsSync(dirPath)) {
            this._makeDir(dirPath);
        }
    }

    private static _makeDir(dirPath: string) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
        } catch (err) {
            throw new Error(`Failed to create directory: ${dirPath} (${err})`);
        }
    }

    private static _getDependenciesJson(dependencies: Dependency[], filePath: string): string {
        try {
            const depsArray = Array.isArray(dependencies) ? Array.from(dependencies) : [];

            return JSON.stringify(depsArray, null, 2);
        } catch (err) {
            throw new Error(`Could not serialize dependencies for ${filePath}. ${err}`);
        }
    }

    private static _logSaveDepsError(err: any) {
        process.stdout.write(String(err) + '\n');
        process.stderr.write('Error saving dependencies\n');
    }
}