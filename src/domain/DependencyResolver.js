const fs = require('fs');
const { execSync } = require('child_process');
const semver = require('semver');

class DependencyResolver {
    constructor() {
        this.packageJson = this.loadJSONFile('package.json');
        this.packageLock = this.loadJSONFile('package-lock.json', true);
        this.collectedRanges = {}; // packageName -> array of version ranges
        this.resolutions = {};     // packageName -> chosen version
    }

    /**
     * Loads a JSON file (package.json or package-lock.json).
     * @param {string} path - Path to the file.
     * @param {boolean} required - If true, exit if the file is not found.
     * @returns {object} Parsed JSON object.
     */
    loadJSONFile(path, required = false) {
        try {
            const data = fs.readFileSync(path, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            if (required) {
                console.error(`Error: ${path} not found or invalid. This script requires a valid ${path}.`);
                process.exit(1);
            } else {
                console.warn(`${path} not found; proceeding without it.`);
                return {};
            }
        }
    }

    /**
     * Collects all version ranges from:
     * 1. Direct dependencies (and optionally devDependencies) in package.json.
     * 2. All "requires" fields in package-lock.json's dependency tree.
     */
    collectVersionRanges() {
        // Collect direct dependencies from package.json
        const directDeps = this.packageJson.dependencies || {};
        const devDeps = this.packageJson.devDependencies || {};

        for (const [pkg, range] of Object.entries({ ...directDeps, ...devDeps })) {
            this.addRange(pkg, range);
        }

        // Traverse package-lock.json dependencies recursively (if available)
        const traverseLock = (deps) => {
            if (!deps) {
                return;
            }

            for (const [pkg, data] of Object.entries(deps)) {
                // "requires" field holds the version ranges that this package needs for its own dependencies.
                if (data.requires) {
                    for (const [reqPkg, reqRange] of Object.entries(data.requires)) {
                        this.addRange(reqPkg, reqRange);
                    }
                }

                // Continue with nested dependencies (if any)
                if (data.dependencies) {
                    traverseLock(data.dependencies);
                }
            }
        };

        traverseLock(this.packageLock.dependencies);
    }

    /**
     * Adds a version range requirement for a package.
     * @param {string} pkg - Package name.
     * @param {string} range - Version range string.
     */
    addRange(pkg, range) {
        if (!this.collectedRanges[pkg]) {
            this.collectedRanges[pkg] = new Set();
        }
        
        this.collectedRanges[pkg].add(range);
    }

    /**
     * Returns the available versions for a package by querying the npm registry.
     * Uses "npm view <package> versions --json".
     * @param {string} packageName
     * @returns {string[]} Array of version strings.
     */
    getAvailableVersions(packageName) {
        try {
            const command = `npm view ${packageName} versions --json`
            const output = execSync(command, { encoding: 'utf8' });
            const versions = JSON.parse(output);

            return versions;
        } catch (err) {
            console.error(`Error fetching versions for ${packageName}:`, err.message);

            return [];
        }
    }

  /**
   * Resolves a single package by choosing a version that satisfies all collected ranges.
   * @param {string} packageName
   * @param {string[]} ranges - Array of version ranges (e.g., ["^1.0.0", "~1.2.3"])
   * @returns {string|null} The chosen version or null if no version satisfies all ranges.
   */
    resolvePackage(packageName, ranges) {
        const availableVersions = this.getAvailableVersions(packageName);
        
        if (!availableVersions || availableVersions.length === 0) {
            console.error(`No available versions found for ${packageName}`);
            return null;
        }

        // Filter available versions to those that satisfy every version range
        const candidates = availableVersions.filter(version =>
            ranges.every(range => semver.satisfies(version, range))
        );

        if (candidates.length === 0) {
            console.error(
                `No version of ${packageName} satisfies all ranges: ${ranges.join(', ')}`
            );

            return null;
        }

        // Sort candidates (highest version first) and return the highest version
        candidates.sort(semver.rcompare);
        return candidates[0];
    }

  /**
   * Resolves conflicts for all packages by:
   * 1. Collecting version ranges.
   * 2. For each package, querying available versions and selecting one that satisfies all ranges.
   */
    resolveConflicts() {
        this.collectVersionRanges();

        // Convert each set of ranges into an array for processing
        for (const pkg in this.collectedRanges) {
            const ranges = Array.from(this.collectedRanges[pkg]);
            const resolvedVersion = this.resolvePackage(pkg, ranges);
            
            if (!resolvedVersion) {
                console.error(`Failed to resolve ${pkg} with ranges: ${ranges.join(', ')}`);
                process.exit(1);
            }

            this.resolutions[pkg] = resolvedVersion;
            console.log(`Resolved ${pkg} to version ${resolvedVersion} (ranges: ${ranges.join(', ')})`);
        }

        return this.resolutions;
    }
}

module.exports = DependencyResolver;