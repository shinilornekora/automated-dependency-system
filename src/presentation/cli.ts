#!/usr/bin/env node
import { program } from 'commander';
import { createADS } from '../index.js';
import { commands } from "./commands/index.js";
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJSONPath = path.join(__dirname, '../../package.json');
const programPackageJSON = JSON.parse(fs.readFileSync(packageJSONPath).toString());

const currentUsername = process.env.ADS_MAINTAINER ?? process.env.USER ?? 'nobody';
const { dependencyService } = createADS(currentUsername);

const rules = commands(dependencyService);

program
    .name('ads')
    .version(programPackageJSON.version)
    .description("Automated Dependency System (ADS) CLI")
    .usage("[commands] arg_1 arg_2 ...");

for (const { command, description, action, option } of rules) {
    if (option) {
        program
            .command(command)
            .description(description)
            .option(option[0], option[1], option[2])
            .action(action)
        continue;
    }

    program
        .command(command)
        .description(description)
        .action(action);
}

function printBanner() {
    console.log(
        chalk.cyanBright(`
        ╔═════════════════════════════════════════════╗
        ║                                             ║
        ║   ${chalk.magentaBright.bold('🚀 Automated Dependency System (ADS) 🚀')}   ║
        ║                                             ║
        ╚═════════════════════════════════════════════╝
        `)
    );
}

function printHelp() {
    printBanner();
    console.log(chalk.magentaBright.bold(` Version: `) + chalk.greenBright(programPackageJSON.version));
    console.log(chalk.gray(` ${programPackageJSON.description || "Automated Dependency System CLI"}\n`));
    console.log(chalk.magentaBright(' Usage: ') + chalk.yellow('ads') + ' ' + chalk.cyan('[command]') + ' ...args\n');
    console.log(chalk.magentaBright(' Commands:'));

    for (const { command, description, option } of rules) {
        let cmd = chalk.magentaBright(command);

        if (option) {
            cmd += chalk.cyan(' ' + option[0] + '         ');
        }

        console.log(`   ${cmd.padEnd(40, ' ')}${chalk.gray(description)}`);
    }

    console.log('\n'+chalk.whiteBright(' Options:'));
    console.log(`   ${chalk.yellowBright('-h, --help')}          ${chalk.gray('Show help')}`);
    console.log(`   ${chalk.yellowBright('-V, --version')}       ${chalk.gray('Show version')}`);

    console.log('\n'+chalk.cyan(' Example: '));
    console.log(chalk.gray('   ads install express'));
    console.log(chalk.gray('   ads remove lodash'));
    console.log('\n');
}

program.showHelpAfterError();

// @ts-expect-error: payload опционален, перезапись безопасна.
program.helpInformation = printHelp;

// Выводим help, если нет аргументов
if (!process.argv.slice(2).length) {
    printHelp();
    process.exit(0);
}

program.parse(process.argv);