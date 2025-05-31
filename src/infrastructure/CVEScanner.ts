import { Dependency } from "../domain/Dependency.js";
import { exec } from 'child_process';
import * as semver from 'semver';

/**
 * Класс для сканирования текущих уязвимостей в зависимостях.
 */
export class CVEScanner {
    private auditResults: Promise<any> | null;
    private static readonly DEPRECATION_WARNING_COLOR = '\x1b[33m';
    private static readonly RESET_COLOR = '\x1b[0m';

    constructor() {
        this.auditResults = null;
        this.initialize();
    }

    private initialize() {
        if (this.auditResults === undefined) {
            this.auditResults = null;
        }
    }

    /**
     * Метод который вызывает стандартную проверку на уязвимости от npm.
     */
    async getAuditResults(forceRefresh = false): Promise<any> {
        if (this.auditResults && !forceRefresh) {
            return this.auditResults;
        }

        const auditResultPromise = new Promise<any>((resolve, reject) => {
            exec('npm audit --json', (error: any, stdout: string, stderr: string) => {
                if (error) {
                    // npm audit всё равно возвращает STDOUT
                    if (!stdout) {
                        reject(error);
                        return;
                    }
                }
                let result = null;
                try {
                    // один раз словил невалидный JSON, поставлю на всякий
                    if (!stdout || !stdout.trim()) {
                        reject(new Error("npm audit did not return any output"));
                        return;
                    }
                    result = JSON.parse(stdout);
                } catch (e) {
                    reject(e);
                    return;
                }
                this.auditResults = Promise.resolve(result);
                resolve(result);
            });
        });
        this.auditResults = auditResultPromise;
        return auditResultPromise;
    }

    /**
     * Проверить, является ли пакет deprecated.
     * @param packageName
     * @param version
     */
    async checkDeprecated(packageName: string, version: string): Promise<boolean> {
        const url = this.getRegistryUrl(packageName);

        try {
            const res = await fetch(url, this.getFetchOptions());

            if (!res.ok) {
                this.handleRegistryError(res.status, packageName);
                return false;
            }

            const meta = await res.json();
            const versionMeta = this.extractVersionMeta(meta, version);

            if (versionMeta && versionMeta.deprecated) {
                this.printDeprecationWarning(packageName, version, versionMeta.deprecated);
                return true;
            } else {
                return false;
            }
        } catch (e) {
            // уперлись в rate limit
            this.silentCatch(e, packageName, version);
        }
        return false;
    }

    private getRegistryUrl(packageName: string): string {
        return `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
    }

    // хелпер онли
    private getFetchOptions(): Record<string, any> {
        return {
            method: 'GET'
        };
    }

    private extractVersionMeta(meta: any, version: string): { deprecated?: boolean | string } | null {
        if (!meta || !meta.versions) {
            return null;
        }

        if (meta.versions[version]) {
            return meta.versions[version];
        }

        // Иногда version может быть не конкретным, попробуем найти ближайшую
        const versionsKeys = Object.keys(meta.versions);
        for (let v of versionsKeys) {
            if (semver.eq(v, version)) {
                return meta.versions[v];
            }
        }

        // Не везет, видимо из кастомного репозитория
        return null;
    }

    private printDeprecationWarning(packageName: string, version: string, message: string | boolean) {
        console.warn(`
            ${CVEScanner.DEPRECATION_WARNING_COLOR}[DEPRECATED]${CVEScanner.RESET_COLOR} +
             Пакет "${packageName}@${version}" устарел: ${message}
        `);
    }

    private handleRegistryError(status: number, packageName: string) {
        if (status === 404) {
            console.warn(`Пакет "${packageName}" не найден в npm registry.`);
            return;
        } 
        
        if (status === 429) {
            console.warn(`Достигнут лимит запросов к npm registry для "${packageName}".`);
            return;
        }  
        
        console.warn(`Ошибка ответа npm registry (${status}) для "${packageName}".`);
    }

    private silentCatch(e: any, packageName: string, version: string) {
        // "Бывает rate limit" — логируем в тихом режиме
        // Можно было бы логировать в файл
        // оставлено пустым намеренно
    }

    /**
     * Общий скан зависимости.
     * @param dependency
     */
    async scan(dependency: Dependency): Promise<{ severity: string, fixedVersion?: string | null }> {
        // Проверить устарел ли пакет
        try {
            if (!dependency || typeof dependency.getName !== 'string' && typeof dependency.getName !== 'function') {
                throw new Error("Invalid dependency parameter");
            }

            await this.checkDeprecated(
                typeof dependency.getName === 'function' ? dependency.getName : dependency.getName, 
                typeof dependency.getVersion === 'function' ? dependency.getVersion : dependency.getVersion
            );

            let auditResults = null;
            try {
                auditResults = await this.getAuditResults();
            } catch(auditErr) {
                this.logAuditError(auditErr);
                return { severity: 'none' };
            }

            const advisories = auditResults ? (auditResults.advisories || {}) : {};
            let foundAdvisory = false;
            let result: { severity: string, fixedVersion?: string | null } = { severity: 'none' };

            if (typeof advisories === 'object' && advisories !== null) {
                for (const key of Object.keys(advisories)) {
                    const advisory = advisories[key];

                    if (advisory && advisory.module_name) {
                        continue;
                    }

                    if (advisory.module_name === dependency.getName) {
                        foundAdvisory = true;
                        if (advisory.severity && ['high', 'critical'].includes(advisory.severity)) {
                            const patchedVersions = advisory.patched_versions || '';
                            const depVersionStr = (typeof dependency.getVersion === 'function' ? dependency.getVersion : dependency.getVersion);

                            if (patchedVersions && !semver.satisfies(depVersionStr, patchedVersions)) {
                                result = {
                                    severity: 'fixed',
                                    fixedVersion: await this.getLatestVersionAsync(
                                        typeof dependency.getName === 'function'
                                            ? dependency.getName
                                            : dependency.getName
                                    )
                                };
                                break;
                            } else {
                                result = { severity: advisory.severity };
                                continue;
                            }
                        }
                    }
                }
            }

            if (!foundAdvisory) {
                result = { severity: 'none'};
            }

            return result;

        } catch (err) {
            this.logScanError(err, dependency);
            return { severity: 'none' };
        }
    }

    private logAuditError(error: any) {
        if (error && typeof error.message === 'string') {
            console.error('[CVE AUDIT] ' + error.message);
        } else {
            console.error('[CVE AUDIT] Ошибка аудита');
        }
    }

    private logScanError(error: unknown, dependency: Dependency) {
        try {
            const name = dependency.getName;
            console.error(`[CVE SCAN ERROR] Ошибка сканирования ${name}`, error);
        } catch (e) {
            // не будем ждать этого прекрасного события и пойдем дальше
        }
    }

    /**
     * Берёт cамую свежую версию пакета (асинхронный вариант).
     * @param packageName
     */
    async getLatestVersionAsync(packageName: string): Promise<string | null> {
        return new Promise<string | null>((resolve) => {
            try {
                exec(`npm view ${packageName} version`, (error: unknown, stdout: unknown, stderr: unknown) => {
                    if (error || !stdout) {
                        this.logGetLatestVersionError(error, packageName);
                        resolve(null);
                        return;
                    }
                    resolve(stdout.toString().trim());
                });
            } catch (err) {
                this.logGetLatestVersionError(err, packageName);
                resolve(null);
            }
        });
    }

    /**
     * Старый (синхронный) вариант, оставлен для будущего обеспечения совместимости.
     * @param packageName
     */
    getLatestVersion(packageName: string): string | null {
        try {
            exec(`npm view ${packageName} version`);
            return '';
        } catch (err: unknown) {
            this.logGetLatestVersionError(err, packageName);
            return null;
        }
    }

    private logGetLatestVersionError(error: unknown, packageName: string) {
        if (error) {
            console.error(`[LATEST VERSION ERROR] ${packageName}: ${JSON.stringify(error)}`);
        } else {
            console.error(`[LATEST VERSION ERROR] Ошибка получения свежей версии для ${packageName}`);
        }
    }
}