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
     * Общий скан пакета, исходная точка.
     * @param dependency
     */
    async scan(dependency: Dependency) {
        try {
            const auditResults = await this.getAuditResults();
            const advisories = auditResults.advisories || {};

            for (const key in advisories) {
                const advisory = advisories[key];

                if (advisory.module_name === dependency.getName) {
                    if (['high', 'critical'].includes(advisory.severity)) {
                        // If a patched version is defined but the current version does not satisfy it, return a "fixed" signal.
                        if (advisory.patched_versions && !semver.satisfies(dependency.getVersion, advisory.patched_versions)) {
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
     * Берет последнюю версию пакета
     * @param packageName
     */
    getLatestVersion(packageName: string) {
        const { execSync } = require('child_process');
        try {
            return execSync(`npm view ${packageName} version`).toString().trim();
        } catch (err) {
            console.error(`Error fetching latest version for ${packageName}`);
            return null;
        }
    }
}
