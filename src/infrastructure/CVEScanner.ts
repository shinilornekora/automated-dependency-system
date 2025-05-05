import { Dependency } from "../domain/Dependency.js";
import { exec } from 'child_process';

import * as semver from 'semver';

/**
 * Класс для сканирования текущих уязвимостей в зависимостях.
 */
export class CVEScanner {
    private auditResults: Promise<any> | null;

    constructor() {
        this.auditResults = null;
    }

    /**
     * Метод который вызывает стандартную проверку на уязвимости от npm.
     */
    async getAuditResults() {
        return new Promise<any>((resolve, reject) => {
            exec('npm audit --json', (_: unknown, stdout: string) => {
                try {
                    const result = JSON.parse(stdout);
                    this.auditResults = result;
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    /**
     * Проверить, является ли пакет deprecated.
     * @param packageName
     * @param version
     */
    async checkDeprecated(packageName: string, version: string) {
        try {
            const res = await fetch(`https://registry.npmjs.org/${packageName}`);
            const meta = await res.json();
            const targetVersion = meta.versions?.[version] as { deprecated: boolean };
            if (targetVersion && targetVersion.deprecated) {
                console.warn(
                    `\x1b[33m[DEPRECATED]\x1b[0m Пакет "${packageName}@${version}" устарел: ${targetVersion.deprecated}`
                );
                return true;
            }
        } catch (e) {
            // fail silently (бывает rate limit)
        }
        return false;
    }

    /**
     * Общий скан зависимости.
     * @param dependency
     */
    async scan(dependency: Dependency) {
        try {
            // Проверить устарел ли пакет
            await this.checkDeprecated(dependency.getName, dependency.getVersion);

            const auditResults = await this.getAuditResults();
            const advisories = auditResults.advisories || {};

            for (const key in advisories) {
                const advisory = advisories[key];

                if (advisory.module_name === dependency.getName) {
                    if (['high', 'critical'].includes(advisory.severity)) {
                        // Если есть patched_versions и текущая версия не удовлетворяет — рекомендуем фикс.
                        if (
                            advisory.patched_versions &&
                            !semver.satisfies(dependency.getVersion, advisory.patched_versions)
                        ) {
                            return {
                                severity: 'fixed',
                                fixedVersion: this.getLatestVersion(dependency.getName)
                            };
                        }

                        return { severity: advisory.severity };
                    }
                }
            }

            return { severity: 'none' };
        } catch (err) {
            console.error(`CVE scanning error for ${dependency.getName}`);
            return { severity: 'none' };
        }
    }

    /**
     * Берёт последнюю версию пакета.
     * @param packageName
     */
    getLatestVersion(packageName: string) {
        try {
            return exec(`npm view ${packageName} version`).toString().trim();
        } catch (err) {
            console.error(`Error fetching latest version for ${packageName}`);
            return null;
        }
    }
}
