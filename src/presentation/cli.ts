#!/usr/bin/env node
import { program } from 'commander';
import { createADS } from '../index';
import {commands } from "./commands";

const programPackageJSON = require("../../package.json");

/**
 * Пытаемся определить текущего пользователя.
 */
const currentUsername = process.env.ADS_MAINTAINER || process.env.USER || 'nobody';
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
