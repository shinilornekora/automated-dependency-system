#!/usr/bin/env node
const program = require('commander');
const createADS = require('./index');
const packageJson = require('../package.json');

// Determine the current user (the maintainer) from an environment variable or fallback.
const currentUser = process.env.ADS_MAINTAINER || process.env.USER || 'defaultMaintainer';
const { dependencyManager, dependencyService } = createADS(currentUser);

program
  .version(packageJson.version)
  .description("Automated Dependency System (ADS) CLI");

program
    .command('check')
    .description("Run ADS checks (CVE scan, remove unused dependencies, lock versions)")
    .action(async () => {
        await dependencyManager.syncWithPackageJson();
        await dependencyService.runADSChecks();

        console.log("ADS checks complete.");
    });

program
    .command('install')
    .description("Run npm install with ADS checks (installing from package.json only)")
    .option('--args <args>', 'Additional arguments for npm install', '')
    .action(async (cmdObj) => {
        const args = cmdObj.args ? cmdObj.args.split(' ') : [];
        await dependencyService.runNpmCommand('install', args);
    });

program
    .command('build')
    .description("Run npm build with ADS checks")
    .action(async () => {
        await dependencyService.runNpmCommand('run', ['build']);
    });

program
    .command('clean-install')
    .description("Run npm clean-install (ci) with ADS checks")
    .action(async () => {
        await dependencyService.runNpmCommand('ci');
    });

program
    .command('add <name> <version>')
    .description("Add a new dependency via ADS (only for maintainers)")
    .action((name, version) => {
        try {
            dependencyManager.addDependency({
                name,
                version,
                maintainer: currentUser,
                readOnly: false,
                isLocal: false
            });
            console.log(`Added dependency ${name}@${version}.`);
        } catch (err) {
            console.error(err.message);
        }
    });

program
    .command('remove <name>')
    .description("Remove a dependency via ADS (only for maintainers)")
    .action((name) => {
        try {
            dependencyManager.removeDependency(name);
            console.log(`Removed dependency ${name}.`);
        } catch (err) {
            console.error(err.message);
        }
    });

program
    .command('allowed-versions <name>')
    .description("Show the three most recent allowed versions for a dependency")
    .action(async (name) => {
        const versions = await dependencyManager.getAllowedVersions(name);
        console.log(`Allowed versions for ${name}:`, versions);
    });

program
    .command('resolve')
    .description('[EXPERIMENTAL]: Try to resolve package.json conflicts')
    .action(async () => {
        await dependencyManager.dependencyResolver.resolveConflicts();
    })

program.parse(process.argv);

// If no command is provided, output help.
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
