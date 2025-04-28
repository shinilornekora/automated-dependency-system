import { Dependency } from "../domain/Dependency";

import { exec } from 'child_process';
import * as semver from 'semver';

export class CVEScanner {
    private auditResults: Promise<any> | null;

    constructor() {
        this.auditResults = null;
    }

    async getAuditResults() {
        if (this.auditResults) {
            return this.auditResults;
        }

        return new Promise((resolve, reject) => {
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
                        const fixedVersion = this.getLatestVersion(dependency.getName);
                        return { severity: 'fixed', fixedVersion };
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

    getLatestVersion(packageName: string) {
        const { execSync } = require('child_process');
        try {
            const version = execSync(`npm view ${packageName} version`).toString().trim();
            return version;
        } catch (err) {
            console.error(`Error fetching latest version for ${packageName}`);
            return null;
        }
    }
}

module.exports = CVEScanner;
