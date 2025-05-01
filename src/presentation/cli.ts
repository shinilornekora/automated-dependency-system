#!/usr/bin/env node
import { program } from 'commander';
import { createADS } from '../index.js';
import { commands } from "./commands/index.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJSONPath = path.join(__dirname, '../../package.json');
const programPackageJSON = JSON.parse(fs.readFileSync(packageJSONPath).toString());

const currentUsername = process.env.ADS_MAINTAINER ?? process.env.USER ?? 'nobody';
const { dependencyService } = createADS(currentUsername);

const rules = commands(dependencyService);

program
    .version(programPackageJSON.version)
    .description("Automated Dependency System (ADS) CLI");

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

program.parse(process.argv);

// Если нет аргументов, то печатаем страницу помощи.
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
