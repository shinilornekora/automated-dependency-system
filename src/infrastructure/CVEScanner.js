const { exec } = require('child_process');
const semver = require('semver');

class CVEScanner {
    constructor() {
        this.auditResults = null;
    }

    async getAuditResults() {
        if (this.auditResults) {
            return this.auditResults;
        }

        return new Promise((resolve, reject) => {
            exec('npm audit --json', (error, stdout, stderr) => {
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

    async scan(dependency) {
        try {
            const auditResults = await this.getAuditResults();
            const advisories = auditResults.advisories || {};
            for (const key in advisories) {
                const advisory = advisories[key];
                if (advisory.module_name === dependency.name) {
                    if (['high', 'critical'].includes(advisory.severity)) {
                        // If a patched version is defined but the current version does not satisfy it, return a "fixed" signal.
                        if (advisory.patched_versions && !semver.satisfies(dependency.version, advisory.patched_versions)) {
                        const fixedVersion = this.getLatestVersion(dependency.name);
                        return { severity: 'fixed', fixedVersion };
                        }
                        return { severity: advisory.severity };
                    }
                }
            }

            return { severity: 'none' };
        } catch (err) {
            console.error(`CVE scanning error for ${dependency.name}: ${err.message}`);
            return { severity: 'none' };
        }
    }

    getLatestVersion(packageName) {
        const { execSync } = require('child_process');
        try {
            const version = execSync(`npm view ${packageName} version`).toString().trim();
            return version;
        } catch (err) {
            console.error(`Error fetching latest version for ${packageName}: ${err.message}`);
            return null;
        }
    }
}

module.exports = CVEScanner;
